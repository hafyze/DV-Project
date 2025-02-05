document.addEventListener("DOMContentLoaded", () => {
    const margin = { top: 30, right: 60, bottom: 70, left: 80 };
    const width = document.getElementById("paretoChart").clientWidth - margin.left - margin.right;
    const height = document.getElementById("paretoChart").clientHeight - margin.top - margin.bottom;

    const svg = d3
        .select("#paretoChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("visibility", "hidden");

    d3.csv("data/climate_change_dataset.csv").then((data) => {
        // Aggregate CO2 emissions by country
        const aggregatedData = d3.rollup(
            data,
            (v) => d3.sum(v, (d) => +d["CO2 Emissions (Tons/Capita)"]),
            (d) => d.Country
        );

        let aggregatedArray = Array.from(aggregatedData, ([country, total]) => ({
            country,
            total,
        })).sort((a, b) => b.total - a.total);

        // FIlter top 10 countries
        aggregatedArray = aggregatedArray.slice(0, 10);

        // Calculate cumulative percentage for Pareto curve line
        let cumulative = 0;
        const totalEmissions = d3.sum(aggregatedArray, (d) => d.total);
        aggregatedArray.forEach((d) => {
            cumulative += d.total;
            d.cumulative = (cumulative / totalEmissions) * 100;
            d.percentage = (d.total / totalEmissions) * 100;
        });

        // Scales
        const xScale = d3
            .scaleBand()
            .domain(aggregatedArray.map((d) => d.country))
            .range([0, width])
            .padding(0.2);

        const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(aggregatedArray, (d) => d.total)])
            .range([height, 0]);

        const yScaleRight = d3
            .scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        // Bars (CO2 emissions)
        svg.selectAll(".bar")
            .data(aggregatedArray)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d) => xScale(d.country))
            .attr("y", (d) => yScale(d.total))
            .attr("width", xScale.bandwidth())
            .attr("height", (d) => height - yScale(d.total))
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible").html(`<strong>${d.country}</strong>: ${d.total.toFixed(2)} Tons/Capita`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        // Pareto line
        const paretoLine = d3
            .line()
            .x((d) => xScale(d.country) + xScale.bandwidth() / 2)
            .y((d) => yScaleRight(d.cumulative));

        svg.append("path")
            .datum(aggregatedArray)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("d", paretoLine);

        // Pareto dots with tooltip
        svg.selectAll(".dot")
            .data(aggregatedArray)
            .enter()
            .append("circle")
            .attr("cx", (d) => xScale(d.country) + xScale.bandwidth() / 2)
            .attr("cy", (d) => yScaleRight(d.cumulative))
            .attr("r", 4)
            .attr("fill", "red")
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible").html(`<strong> ${d.country} </strong>:<br>${d.percentage.toFixed(2)}% Contribution<br><style='display:inline-block;'>${d.cumulative.toFixed(2)}% Cumulative`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        // Axes
        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale))
            .selectAll("text")
            .text(d => d.length > 10 ? d.slice(0,9) + "...": d)
            .style("text-anchor", "end")
            .attr("dx", "1em")
            .attr("dy", "0.8em")
            .attr("transform", "rotate(-22)");

        svg.append("g").call(d3.axisLeft(yScale));
        svg.append("g").attr("transform", `translate(${width},0)`).call(d3.axisRight(yScaleRight));

        // X-axis label
        svg.append("text")
            .attr("x", width / 2.2)
            .attr("y", height + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("COUNTRIES");

        // Y-axis label (left)
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("CO2 Emissions (Tons/Capita)");

        // Y-axis label (right)
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", width + 50)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "red")
            .text("Cumulative Percentage (%)");

    });
});
