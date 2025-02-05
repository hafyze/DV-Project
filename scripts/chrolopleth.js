document.addEventListener("DOMContentLoaded", () => {
    const width = 900, height = 550;

    // Create a flex container to hold both the map and the legend
    const container = d3.select("#chrolopoleth")
        .style("display", "flex")
        .style("justify-content", "space-between")
        .style("align-items", "center")
        .style("gap", "20px")
        .style("width", "100%");

    // Append an SVG for the map inside the flex container
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "80%")
        .style("height", "100%")
        .style("background-color", "white");

    // Append the legend beside the map
    const legendContainer = container.append("div")
        .attr("id", "legend-container")
        .style("width", "20%")
        .style("min-width", "250px");

    // Load JSON map (world countries)
    Promise.all([
        d3.json("data/countries.geo.json"),
        d3.csv("data/climate_change_dataset.csv")
    ]).then(([worldData, data]) => {
        console.log("GeoJSON Loaded:", worldData);
        console.log("CSV Loaded:", data);

        // Mapping dataset country names to JSON names
        const countryNameMap = {
            "USA": "United States of America",
            "UK": "United Kingdom",
        };

        // Apply name mapping to the dataset
        const countryLatestData = {};
        data.filter(d => d.Year == "2023").forEach(d => {
            const countryName = countryNameMap[d.Country] || d.Country;
            countryLatestData[countryName] = +d["Renewable Energy (%)"];
        });

        // Convert to an array and sort by highest Renewable Energy (%)
        const sortedCountries = Object.entries(countryLatestData)
            .map(([country, value]) => ({ country, value }))
            .sort((a, b) => b.value - a.value);

        // Define new light yellow to green to dark blue color scale
        const colorScale = d3.scaleLinear()
            .domain([5, 15, 25, 35, 45, 50]) // Define stops
            .range(["#ffffcc", "#c2e699", "#78c679", "#31a354", "#006837", "#08306b"]);

        // Define projection and path with zoom support
        const projection = d3.geoNaturalEarth1()
            .scale(160)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const zoom = d3.zoom()
            .scaleExtent([1, 8]) // Allow zooming in and out
            .on("zoom", (event) => {
                svg.selectAll("g").attr("transform", event.transform);
            });

        svg.call(zoom);

        // Create a group for the map
        const g = svg.append("g");

        // Draw countries
        g.selectAll(".country")
            .data(worldData.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("fill", d => countryLatestData[d.properties.name] !== undefined ? colorScale(countryLatestData[d.properties.name]) : "#eee")
            .attr("stroke", "white")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke", "black");
                tooltip.style("display", "block")
                    .html(`<strong>${d.properties.name}</strong><br>Renewable Energy (2023): ${countryLatestData[d.properties.name] !== undefined ? countryLatestData[d.properties.name] + '%' : 'N/A'}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke", "white");
                tooltip.style("display", "none");
            });

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid black")
            .style("padding", "5px")
            .style("display", "none");

        // Append legend inside the new legend container
        const legend = legendContainer.append("svg")
            .attr("width", 250)
            .attr("height", 60);

        const defs = legend.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffffcc");

        linearGradient.append("stop")
            .attr("offset", "25%")
            .attr("stop-color", "#c2e699");

        linearGradient.append("stop")
            .attr("offset", "50%")
            .attr("stop-color", "#78c679");

        linearGradient.append("stop")
            .attr("offset", "75%")
            .attr("stop-color", "#006837");

        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#08306b");

        legend.append("rect")
            .attr("x", 10)
            .attr("y", 10)
            .attr("width", 180)
            .attr("height", 20)
            .style("fill", "url(#legend-gradient)");

        // Min and max labels
        legend.append("text")
            .attr("x", 10)
            .attr("y", 55)
            .text("00.0%");

        legend.append("text")
            .attr("x", 160)
            .attr("y", 55)
            .text("50.0%");

        // Add ranking title
        legendContainer.append("h3")
            .text("Top Renewable Energy Countries")
            .style("margin-top", "10px");

        // Populate ranking list
        sortedCountries.forEach((d, i) => {
            legendContainer.append("p").html(`<strong>${i + 1}. ${d.country}</strong>: ${d.value}%`);
        });

    }).catch(error => console.error("Error loading data:", error));
});
