document.addEventListener("DOMContentLoaded", () => {
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    // IMPORTANT: nak make sure dia tak overflow
    const width = document.getElementById("example").clientWidth - margin.left - margin.right;
    const height = document.getElementById("example").clientHeight - margin.top - margin.bottom; 

    const svg = d3
        .select("#example")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/climate_change_dataset.csv").then((data) => {
        // Parse and aggregate data by year, summing rainfall values
        const aggregatedData = d3.rollup(
            data,
            (v) => d3.sum(v, (d) => +d["Rainfall (mm)"]), // Summing Rainfall
            (d) => d.Year // Group by Year
        );

        // Convert aggregatedData to an array and sort by year
        const aggregatedArray = Array.from(aggregatedData, ([year, total]) => ({
            year: +year,  // Convert year to number
            total: total, // Sum of Rainfall (mm)
        }));

        // Sort the data by year in ascending order
        aggregatedArray.sort((a, b) => a.year - b.year);

        console.log(aggregatedArray); // Show aggregated and sorted data for debugging

        // Scales
        const xScale = d3
            .scaleLinear()
            .domain(d3.extent(aggregatedArray, (d) => d.year))
            .range([0, width]);

        const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(aggregatedArray, (d) => d.total)])
            .range([height, 0]);

        // Axes
        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
        svg.append("g").call(d3.axisLeft(yScale));

        // Line Generator
        const line = d3
            .line()
            .x((d) => xScale(d.year))
            .y((d) => yScale(d.total));

        // Draw the line
        svg.append("path")
            .datum(aggregatedArray)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Total Rainfall Over Time");
    });
});
