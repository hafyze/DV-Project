document.addEventListener("DOMContentLoaded", () => {
    // Set up margins and dimensions
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const container = document.getElementById("lineChart");
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
  
    // Append the SVG object to the div called 'lineChart'
    const svg = d3
      .select("#lineChart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
    // Create a tooltip div that is hidden by default
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  
    // Load the CSV data
    d3.csv("data/climate_change_dataset.csv").then((data) => {
      // Aggregate data by year for Extreme Weather Events
      // If a year appears more than once, we sum the values.
      const aggregatedData = d3.rollup(
        data,
        (v) => d3.sum(v, (d) => +d["Extreme Weather Events"]),
        (d) => d.Year
      );
  
      // Convert the aggregated data (a Map) into an array of objects and sort by year
      const aggregatedArray = Array.from(aggregatedData, ([year, total]) => ({
        year: +year,
        total: total,
      })).sort((a, b) => a.year - b.year);
  
      console.log("Aggregated Data:", aggregatedArray);
  
      // Set up the x-scale (years) and y-scale (total extreme events)
      const xScale = d3
        .scaleLinear()
        .domain(d3.extent(aggregatedArray, (d) => d.year))
        .range([0, width]);
  
      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(aggregatedArray, (d) => d.total)])
        .nice()
        .range([height, 0]);
  
      // Optional: add horizontal gridlines for better readability
      svg
        .append("g")
        .attr("class", "grid")
        .call(
          d3
            .axisLeft(yScale)
            .ticks(5)
            .tickSize(-width)
            .tickFormat("")
        )
        .attr("stroke-opacity", 0.1);
  
      // Add the x-axis
      svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
  
      // Add the y-axis
      svg.append("g").call(d3.axisLeft(yScale));
  
      // Create the line generator
      const line = d3
        .line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.total));
  
      // Draw the line path
      svg
        .append("path")
        .datum(aggregatedArray)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
  
      // Add circles for each data point with interactive tooltip
      svg
        .selectAll("circle")
        .data(aggregatedArray)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScale(d.total))
        .attr("r", 4)
        .attr("fill", "orange")
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(100)
            .attr("r", 8);
  
          tooltip
            .transition()
            .duration(100)
            .style("opacity", 1);
          tooltip
            .html(
              `<strong>Year:</strong> ${d.year}<br><strong>Total Extreme Weather Events:</strong> ${d.total}`
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(100)
            .attr("r", 4);
          tooltip.transition().duration(100).style("opacity", 0);
        });
  
      // Add a title for the chart
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Extreme Weather Events by Year");
  
      // Add x-axis label
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Year");
  
      // Add y-axis label
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Total Extreme Weather Events");
    });
  });
  