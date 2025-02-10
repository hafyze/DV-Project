document.addEventListener("DOMContentLoaded", () => {
  // Set up margins and dimensions (increase bottom margin to accommodate buttons)
  const margin = { top: 30, right: 30, bottom: 80, left: 60 };
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

  // Create a tooltip div (hidden by default)
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
    // Aggregate data by year for Extreme Weather Events (summing if a year appears more than once)
    const aggregatedData = d3.rollup(
      data,
      (v) => d3.sum(v, (d) => +d["Extreme Weather Events"]),
      (d) => d.Year
    );

    // Convert the aggregated Map into an array of objects and sort by year
    const aggregatedArray = Array.from(aggregatedData, ([year, total]) => ({
      year: +year,
      total: total,
    })).sort((a, b) => a.year - b.year);

    console.log("Aggregated Data:", aggregatedArray);

    // Compute line segments connecting consecutive years.
    // Each segment stores the start and end points and the year-to-year difference (diff)
    const segments = aggregatedArray.slice(1).map((d, i) => ({
      start: aggregatedArray[i],
      end: d,
      diff: d.total - aggregatedArray[i].total, // positive: spike; negative: decrease
    }));

    console.log("Segments:", segments);

    // Set up the x-scale (years) and y-scale (extreme events)
    const minYear = d3.min(aggregatedArray, d => d.year);
    const maxYear = d3.max(aggregatedArray, d => d.year);
    const xScale = d3
      .scaleLinear()
      .domain([minYear - 1, maxYear]) // subtract 1 to add left padding
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(aggregatedArray, (d) => d.total)])
      .nice()
      .range([height, 0]);

    // Optional: add horizontal gridlines for readability
    svg
      .append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(""))
      .attr("stroke-opacity", 0.1);

    // -------------------------------
    // X-AXIS WITH ROTATION
    // -------------------------------
    // Append the x-axis with a class for easier selection and apply rotation
    const xAxis = svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    xAxis.selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "1em")
      .attr("dy", "0.8em");

    // Function to update the rotation of the x-axis labels based on screen width
    function updateAxisRotation() {
      const screenWidth = window.innerWidth;
      const rotationAngle = screenWidth < 768 ? -30 : 0; // Use -30° for small screens, -15° for larger screens
      svg.selectAll("g.x-axis text")
        .attr("transform", `rotate(${rotationAngle})`);
    }

    // Initial call and update on resize
    updateAxisRotation();
    window.addEventListener("resize", updateAxisRotation);

    // -------------------------------
    // Add the y-axis
    // -------------------------------
    const yAxis = svg.append("g").call(d3.axisLeft(yScale));

    // -------------------------------
    // DRAW THE LINE SEGMENTS (instead of one continuous path)
    // -------------------------------
    // Bind the segments data and draw each as a separate line
    const segmentSelection = svg
      .selectAll(".segment")
      .data(segments)
      .enter()
      .append("line")
      .attr("class", "segment")
      .attr("x1", (d) => xScale(d.start.year))
      .attr("y1", (d) => yScale(d.start.total))
      .attr("x2", (d) => xScale(d.end.year))
      .attr("y2", (d) => yScale(d.end.total))
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);

    // Draw circles for each data point
    const circles = svg
      .selectAll(".datapoint")
      .data(aggregatedArray)
      .enter()
      .append("circle")
      .attr("class", "datapoint")
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

    // -------------------------------
    // AXIS LABELS
    // -------------------------------
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 45)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Year");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Total Extreme Weather Events");

    // -------------------------------
    // BUTTON FILTER SYSTEM
    // -------------------------------
    // Insert a div for filter buttons (before the SVG element)
    const filterDiv = d3
      .select("#lineChart")
      .insert("div", "svg")
      .attr("class", "filter-buttons")
      .style("margin-bottom", "10px");

    // "Reset" button with extra styling and gap
    filterDiv
      .append("button")
      .text("Reset")
      .style("margin-right", "10px")
      .style("padding", "8px 16px")
      .style("border", "none")
      .style("border-radius", "5px")
      .style("background-color", "#ccc")
      .style("color", "#000")
      .style("cursor", "pointer")
      .on("click", resetHighlight);

    // "Spikes" button with extra styling and gap
    filterDiv
      .append("button")
      .text("Spikes (Top 3)")
      .style("margin-right", "10px")
      .style("padding", "8px 16px")
      .style("border", "none")
      .style("border-radius", "5px")
      .style("background-color", "#e74c3c")
      .style("color", "#fff")
      .style("cursor", "pointer")
      .on("click", () => {
        const topSpikes = segments
          .filter((d) => d.diff > 0)
          .sort((a, b) => b.diff - a.diff)
          .slice(0, 3);
        updateHighlight(topSpikes, "red");
      });

    // "Decreases" button with extra styling and gap
    filterDiv
      .append("button")
      .text("Decreases (Top 3)")
      .style("margin-right", "10px")
      .style("padding", "8px 16px")
      .style("border", "none")
      .style("border-radius", "5px")
      .style("background-color", "#27ae60")
      .style("color", "#fff")
      .style("cursor", "pointer")
      .on("click", () => {
        const topDecreases = segments
          .filter((d) => d.diff < 0)
          .sort((a, b) => a.diff - b.diff)
          .slice(0, 3);
        updateHighlight(topDecreases, "green");
      });

    // -------------------------------
    // UPDATE HIGHLIGHT FUNCTION
    // -------------------------------
    // Update the stroke styles on segments based on the highlighted ones and add annotations
    function updateHighlight(highlightSegments, highlightColor) {
      segmentSelection
        .transition()
        .duration(1000)
        .attr("stroke-width", (d) =>
          highlightSegments.includes(d) ? 6 : 1
        )
        .attr("stroke", (d) =>
          highlightSegments.includes(d) ? highlightColor : "steelblue"
        );

      // Remove any previous annotations
      svg.selectAll(".annotation").remove();

      // For each highlighted segment, add annotation text offset from the line's midpoint
      highlightSegments.forEach((seg) => {
        // Calculate the mid-point coordinates of the segment
        const x1 = xScale(seg.start.year);
        const y1 = yScale(seg.start.total);
        const x2 = xScale(seg.end.year);
        const y2 = yScale(seg.end.total);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        // Determine horizontal offset based on whether it's a spike or decrease:
        // For spikes (diff > 0), shift left; for decreases (diff < 0), shift right.
        const xOffset = seg.diff > 0 ? -15 : 15;
        const yOffset = seg.diff > 0 ? -15 : -3; // vertical offset
        svg
          .append("text")
          .attr("class", "annotation")
          .attr("x", midX + xOffset)
          .attr("y", midY + yOffset)
          .attr("text-anchor", "middle")
          .style("fill", highlightColor)
          .style("font-size", "12px")
          .style("font-weight", "bold")
          //.style("stroke", "white") // Uncomment if you want a white stroke for contrast
          //.style("stroke-width", "0.5px")
          .text(seg.diff > 0 ? `+${seg.diff}` : seg.diff);
      });
    }

    // -------------------------------
    // RESET HIGHLIGHT FUNCTION
    // -------------------------------
    // Reset all segments to the default style and remove annotations
    function resetHighlight() {
      segmentSelection
        .transition()
        .duration(1000)
        .attr("stroke-width", 2)
        .attr("stroke", "steelblue");
      svg.selectAll(".annotation").remove();
    }
  });
});
