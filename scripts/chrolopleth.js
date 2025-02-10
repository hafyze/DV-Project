document.addEventListener("DOMContentLoaded", () => {
    const width = 900, height = 550;

    // Create a flexible container for the map and legend
    const container = d3.select("#chrolopoleth")
        .style("display", "flex")
        .style("flex-direction", "row")
        .style("flex-wrap", "nowrap")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("gap", "20px")
        .style("width", "100%");

    // Append an SVG for the map inside the flex container
    const svg = container.append("svg")
        .attr("id", "map-svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "70%")
        .style("height", "100%")
        .style("background-color", "white");

    // Append the legend container beside the map
    const legendContainer = container.append("div")
        .attr("id", "legend-container")
        .style("width", "30%")
        .style("min-width", "250px")
        .style("text-align", "left");

    function adjustLayout() {
        const mapWidth = svg.node().getBoundingClientRect().width;
        const legendWidth = legendContainer.node().getBoundingClientRect().width;

        if (mapWidth < 600) {
            // If map width is less than 600 px, move legend below
            container.style("flex-direction", "column");
            svg.style("width", "100%");
            legendContainer.style("width", "100%").style("text-align", "center");
        } else {
            // Keep legend beside the map
            container.style("flex-direction", "row");
            svg.style("width", "70%");
            legendContainer.style("width", "30%").style("text-align", "left");
        }
    }

    window.addEventListener("resize", adjustLayout);

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

        function updateMap(selectedYear) {
            svg.selectAll("*").remove();
            legendContainer.selectAll("*").remove();

            // Filter data based on selected year
            const filteredData = selectedYear === "all"
                ? data
                : data.filter(d => d.Year == selectedYear);

            const countryData = {};
            filteredData.forEach(d => {
            const countryName = countryNameMap[d.Country] || d.Country;
                countryData[countryName] = +d["Renewable Energy (%)"];
        });
        
        // Convert to an array and sort by highest Renewable Energy (%)
            const sortedCountries = Object.entries(countryData)
            .map(([country, value]) => ({ country, value }))
            .sort((a, b) => b.value - a.value);

        // Define new light yellow to green to dark blue color scale
        const colorScale = d3.scaleLinear()
            .domain([5, 15, 25, 35, 45, 50])
            .range(["#ffffcc", "#c2e699", "#78c679", "#31a354", "#006837", "#08306b"]);

        // Define projection and path with zoom support
        const projection = d3.geoNaturalEarth1()
            .scale(160)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        const zoom = d3.zoom()
            .scaleExtent([1, 8])
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
            .attr("fill", d => countryData[d.properties.name] !== undefined ? colorScale(countryData[d.properties.name]) : "#eee")
            .attr("stroke", "white")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke", "black");
                tooltip.style("display", "block")
                    .html(`<strong>${d.properties.name}</strong><br>Renewable Energy (${selectedYear}): ${countryData[d.properties.name] !== undefined ? countryData[d.properties.name] + '%' : 'N/A'}`)
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
            .attr("width", "100%")
            .attr("height", 60);

        const defs = legend.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        linearGradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffffcc");
        linearGradient.append("stop").attr("offset", "25%").attr("stop-color", "#c2e699");
        linearGradient.append("stop").attr("offset", "50%").attr("stop-color", "#78c679");
        linearGradient.append("stop").attr("offset", "75%").attr("stop-color", "#006837");
        linearGradient.append("stop").attr("offset", "100%").attr("stop-color", "#08306b");

        legend.append("rect")
            .attr("x", "50%")
            .attr("y", 10)
            .attr("width", 180)
            .attr("height", 20)
            .attr("transform", "translate(-90, 0)")
            .style("fill", "url(#legend-gradient)");

        // Min and max labels centered relative to the gradient
        legend.append("text")
            .attr("x", "50%")
            .attr("y", 55)
            .attr("transform", "translate(-90, 0)")
            .style("text-anchor", "start")
            .text("00.0%");

        legend.append("text")
            .attr("x", "50%")
            .attr("y", 55)
            .attr("transform", "translate(90, 0)")
            .style("text-anchor", "end")
            .text("50.0%");

        // Add ranking title
        legendContainer.append("h3")
            .text(`Top Renewable Energy Countries (${selectedYear})`)
            .style("margin-top", "10px");

        // Populate ranking list
        sortedCountries.forEach((d, i) => {
            legendContainer.append("p").html(`<strong>${i + 1}. ${d.country}</strong>: ${d.value}%`);
        });

        // Adjust layout after data is loaded
        adjustLayout();
    }

        updateMap("all"); // Default year will load all upon loading to page

    document.getElementById("yearSelect").addEventListener("change", (event) => {
        updateMap(event.target.value);
    });

}).catch(error => console.error("Error loading data:", error));
});
