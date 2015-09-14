define("vizards_viz_ext_salesmagic-src/js/render", [], function() {

	function parseData(data, filterStartDate, filterEndDate) {

		var reps = new Array();

		data.forEach(function(d) {
			var rep = null;
			var isFound = false;
			for (var i = 0; i < reps.length; i++) {
				if (reps[i].repId === d.repId) {
					isFound = true;

					rep = reps[i];
					break;
				}
			}
			if (!isFound) {
				rep = {
					repId: d.repId,
					sales: 1,
					opportunities: 1,
					totalRevenue: 1,
					totalEstimationValue: 1,
					closeRate: 0,
					deltaEstimateToSale: 0
				};
				reps.push(rep);
			}

			// d.startDate = Date.parse(d.startDate);
			// d.dueDate = Date.parse(d.dueDate);

			// if (!d.orderDate)

			// if((d.orderDate||"").length !== 0) {
			// d.orderDate = Date.parse(d.orderDate);
			// } else {
			// d.orderDate = null;
			// }

			if (d.orderDate) {
				if (Date.parse(d.orderDate) < Date.parse(filterEndDate) && Date.parse(d.orderDate) >= Date.parse(filterStartDate)) {
					rep.sales++;
					rep.totalRevenue += +d.revenue;

				}
				// opportunityCount
			}
			if (d.dueDate) {
				if ((Date.parse(d.dueDate) > Date.parse(filterStartDate))&&(Date.parse(d.dueDate) < Date.parse(filterEndDate))) {
					rep.opportunities++;
					rep.totalEstimationValue += +d.estimateValue;
				}
			}

		});

		// TODO for each rep

		for (var index = 0; index < reps.length; index++) {
			if (reps[index].opportunites === 0 || reps[index].totalEstimationValue === 0) {
				reps[index].closeRate = 0;
				reps[index].deltaEstimateToSale = 0;
			} else {
				reps[index].closeRate = reps[index].sales / reps[index].opportunities;
				reps[index].deltaEstimateToSale = reps[index].totalRevenue / reps[index].totalEstimationValue;

			}
		}
		return reps;
	}

	/*
	 * This function is a drawing function; you should put all your drawing logic in it.
	 * it's called in moduleFunc.prototype.render
	 * @param {Object} data - proceessed dataset, check dataMapping.js
	 * @param {Object} container - the target d3.selection element of plot area
	 * @example
	 *   container size:     this.width() or this.height()
	 *   chart properties:   this.properties()
	 *   dimensions info:    data.meta.dimensions()
	 *   measures info:      data.meta.measures()
	 */
	var render = function(allData, container) {
		var allParsedData = parseData(allData, new Date("7-1-2015"), new Date("10-1-2015"));

			var margin = {
				top: 10,
				right: 10,
				bottom: 100,
				left: 10
			}, margin2 = {
				top: 430,
				right: 10,
				bottom: 20,
				left: 10
			};
			
			var width = 750 - margin.left - margin.right,
				height = 500 - margin.top - margin.bottom,
				timelineHeight = 500 - margin2.top - margin2.bottom,
				gartnerWidth = width - 30,
				gartnerHeight = height;

			// scales
			var dateScale = d3.time.scale().domain([ d3.min(allData, function(d) {
				return Date.parse(d.dueDate);
			}), d3.max(allData, function(d) {
				return Date.parse(d.dueDate);
			}) ]).range([ 0, gartnerWidth ]);

			var totalRevenueScale = d3.scale.linear().domain([ 0, d3.max(allData, function(d) {
				return +d.revenue;
			}) ]).range([ timelineHeight, 0 ]);

			var radius = d3.scale.linear().domain([ 1, d3.max(allParsedData, function(d) {
				return Math.max(+d.totalRevenue, +d.totalEstimationValue);
			}) ]).range([ 10, 40 ]).clamp([ 10, 40 ]);
			var colorScale = d3.scale.linear().domain([ 
					d3.min(allParsedData, function(d) { return +d.totalRevenue - +d.totalEstimationValue; }),
					d3.max(allParsedData, function(d) { return +d.totalRevenue - +d.totalEstimationValue; })
				]).range([ -60, 60 ]).clamp([ -60, 60 ]);
			var xScale = d3.scale.linear().range([ 0, gartnerWidth ]).clamp([ 0, gartnerWidth ]); // Allow 30 pixels of space for the labels.
			var yScale = d3.scale.linear().domain([ 0, d3.max(allParsedData, function(d) {
				return +d.sales;
			}) ]).range([ gartnerHeight, 0 ]).clamp([ gartnerHeight, 0 ]);

			function updateScales(newData) {
				radius.domain([ 1, d3.max(newData, function(d) {
					return Math.max(+d.totalRevenue, 0);
				}) ]);
				colorScale.domain([ 
					d3.min(newData, function(d) { return +d.totalRevenue - +d.totalEstimationValue; }),
					d3.max(newData, function(d) { return +d.totalRevenue - +d.totalEstimationValue; })
				]);
				yScale.domain([ 0, d3.max(newData, function(d) {
					return +d.sales;
				}) ]);
				
			}

			function createOuterCircles(newData) {
				return;
				
				var outerCircles = container.selectAll('circle.outer').data(newData);

				outerCircles.enter().append("circle")
					.attr('class', "outer")
					.attr('opacity', 0)
					.attr('cx', xScale(0))
					.attr('cy', yScale(0))
					.attr("r", radius(1))
					.attr("stroke-dasharray", "10,10")
					.attr('fill', "transparent")
					;

				outerCircles.transition()
					.attr("cx", function(d) { return xScale(d.closeRate); })
					.attr("cy", function(d) { return yScale(d.sales)+50; })
					.attr('r', function(d) { return radius(d.totalEstimationValue); })
					.attr('opacity', 1)
					;

				outerCircles.exit().transition().attr('opacity', 0).remove();
			}

			function createInnerCircles(newData) {
				var innerCircles = container.selectAll('circle.inner').data(newData);

				// enter
				innerCircles.enter().append("circle")
					.attr('class', "inner")
					.attr('opacity', 0)
					.attr('cx', xScale(0))
					.attr('cy', yScale(0))
					.attr("r", radius(1))
					;

				innerCircles.transition()
					.attr("cx", function(d) { return xScale(+d.closeRate); })
					.attr("cy", function(d) {
						return yScale(d.sales)+50;
					})
					.attr('r', function(d) { return radius(+d.totalRevenue); })
					.attr("stroke", "1").attr('fill', function(d) {
						return "hsla(" + (60 + colorScale(+d.totalRevenue - +d.totalEstimationValue)) + ", 100%, 50%, 0.3)";
					})
					.attr('opacity', 1)
					;
					
				innerCircles.on({
					"mouseover": function(d) {
						$('*[data-id="'+d.repId+'"]').css("opacity", "1");
						$('.cname[data-id="'+d.repId+'"]').css("opacity", "0");
					},
					"mouseleave": function(d) {
						$('*[data-id="'+d.repId+'"]').css("opacity", "0");
						$('.cname[data-id="'+d.repId+'"]').css("opacity", "1");
					}
				});

				innerCircles.exit().transition().attr('opacity', 0).remove();
			}
			
			function createLabels(newData) {

				var circleLabel = container.selectAll("text.label.cname").data(newData);
				circleLabel.enter().append("text")
					.attr("data-id", function(d) { return d.repId; })
					.attr("class", "label cname")
					.attr("opacity", 0)
					.attr("x", 0)
					.attr("y", 0)
					;
				circleLabel.transition()
					.attr("x", function(d) {
						return xScale(d.closeRate) - 12 + 2;
					}).attr("y", function(d) {
						return yScale(d.sales) + 50 - 2 + 5 ;
					}).attr('opacity', function(d) {
						return d.opportunities ? 1 : 0;
					}).text(function(d) {
						return d.repId;
					});
				circleLabel.exit().transition()
					.attr("opacity", 0)
					.attr("x", 0)
					.remove();

				var x = 30;

				var bg = container.selectAll("rect.popup").data(newData);
				bg.enter().append("rect")
					.attr("data-id", function(d) { return d.repId; })
					.attr("class", "popup")
					.attr("x1", 0)
					.attr("x2", 0)
					.attr("y1", 0)
					.attr("y2", 0)
					.attr("opacity", 0)
					;
				bg.transition()
					.attr("x", function(d) { return xScale(d.closeRate) + x; })
					.attr("width", 180)
					.attr("y", function(d) { return yScale(d.sales) + 50 - 14; })
					.attr("height", 100)
					.attr("stroke", "#888")
					.attr("fill", "rgba(200,200,200,.5)")
					.attr("opacity", 1)
					;
				bg.exit()
					.attr("opacity", 0)
					.remove();
					
				var nameLabels = container.selectAll("text.label.name").data(newData);
				nameLabels.enter().append("text")
					.attr("data-id", function(d) { return d.repId; })
					.attr("class", "label name")
					.attr("opacity", 0)
					.attr("x", 0)
					.attr("y", 0)
					;
				nameLabels.transition()
					.attr("x", function(d) {
						return xScale(d.closeRate) + 10 + 2 + x;
					}).attr("y", function(d) {
						return yScale(d.sales)+50 + 10;
					}).attr('opacity', function(d) {
						return d.opportunities ? 1 : 0;
					}).text(function(d) {
						return "Name: " + d.repId;
					});
				nameLabels.exit().transition()
					.attr("opacity", 0)
					.attr("x", 0)
					.remove();
					
				var closingLabels = container.selectAll("text.label.closing").data(newData);
				closingLabels.enter().append("text")
					.attr("data-id", function(d) { return d.repId; })
					.attr("class", "label closing")
					.attr("opacity", 0)
					.attr("x", 0)
					.attr("y", 0)
					;
				closingLabels.transition()
					.attr("x", function(d) {
						return xScale(d.closeRate) + 10 + 2 + x;
					}).attr("y", function(d) {
						return yScale(d.sales)+50 + 30;
					}).attr('opacity', function(d) {
						return d.opportunities ? 1 : 0;
					}).text(function(d) {
						return "Close rate: " + d3.format("2%")(d.closeRate);
					});
				closingLabels.exit().transition()
					.attr("opacity", 0)
					.attr("x", 0)
					.remove();
					
				var salesLabels = container.selectAll("text.label.sales").data(newData);
				salesLabels.enter().append("text")
					.attr("data-id", function(d) { return d.repId; })
					.attr("class", "label sales")
					.attr("opacity", 0)
					.attr("x", 0)
					.attr("y", 0)
					;
				salesLabels.transition()
					.attr("x", function(d) {
						return xScale(d.closeRate) + 10 + 2 + x;
					}).attr("y", function(d) {
						return yScale(d.sales)+50 + 50;
					}).attr('opacity', function(d) {
						return d.opportunities ? 1 : 0;
					}).text(function(d) {
						return "Sales: " + d.sales;
					});
				salesLabels.exit().transition()
					.attr("opacity", 0)
					.attr("x", 0)
					.remove();
					
				var revenueLabels = container.selectAll("text.label.revenue").data(newData);
				revenueLabels.enter().append("text")
					.attr("data-id", function(d) { return d.repId; })
					.attr("class", "label revenue")
					.attr("opacity", 0)
					.attr("x", 0)
					.attr("y", 0)
					;
				revenueLabels.transition()
					.attr("x", function(d) {
						return xScale(d.closeRate) + 10 + 2 + x;
					}).attr("y", function(d) {
						return yScale(d.sales)+50 + 70;
					}).attr('opacity', function(d) {
						return d.opportunities ? 1 : 0;
					}).text(function(d) {
						return "Revenue: " + "$" +d3.format(",.2f")(d.totalRevenue);
					});
				revenueLabels.exit().transition()
					.attr("opacity", 0)
					.attr("x", 0)
					.remove();

			}
	

			function renderCircles(newData) {

				updateScales(newData);
				
				createOuterCircles(newData);
				createInnerCircles(newData);
				createLabels(newData);

			}


			function createTimeline() {
				var xTimeAxis = d3.svg.axis().scale(dateScale).orient("bottom");
				var yTimeAxis = d3.svg.axis().scale(totalRevenueScale).orient("left").ticks([4]);
				
				var timeline = d3.svg.area().interpolate("monotone")
					.x(function(d) {
						return dateScale(Date.parse(d.dueDate));
					})
					.y0(timelineHeight)
					.y1(function(d) {
						return totalRevenueScale(+d.revenue);
					});


				var brush = d3.svg.brush().x(dateScale)
				// .y(totalRevenueScale)
					.on("brushend", function brushed() {
						// brushy brushy
						var extent = brush.empty() ? dateScale.domain() : brush.extent();
						renderCircles(parseData(allData, extent[0], extent[1]));
					});

				// container.append("defs").append("clipPath")
				// .attr("id", "clip").append("rect").attr("width", width).attr("height", height);

				var timelineContext = container.append("g")
					.attr("class", "timelineContext")
					.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
	
				// render timeline for all data
				timelineContext.append("path")
					.datum(allData)
					.attr("class", "area")
					.attr("d", timeline);
	
				// x axis
				timelineContext.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + timelineHeight + ")")
					.call(xTimeAxis);
					
					// x axis
				timelineContext.append("g")
					.attr("class", "y axis")
					.attr("transform", "translate(0," + 0 + ")")
					.call(yTimeAxis);
	
				// attach the brush
				timelineContext.append("g")
					.attr("class", "x brush")
					.call(brush)
					.selectAll("rect")
						.attr("y", 0)
						.attr("height", timelineHeight + 3);

			}

			function createGartner() {
				
				var xGartnerAxis = d3.svg.axis().scale(xScale).orient("top");
				var yGartnerAxis = d3.svg.axis().scale(yScale).orient("right");
				
				var gartnerContext = container.append("g")
					.attr("class", "gartnerContext")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
					;
					
				// x axis + helpers
				gartnerContext.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + gartnerHeight + ")")
					.call(xGartnerAxis)
					;
					
				gartnerContext.append("line")
					.attr("class", "x blind axis")
					.attr("x1", 0)
					.attr("x2", gartnerWidth)
					.attr("y1", 0)
					.attr("y2", 0)
					;
					
				gartnerContext.append("line")
					.attr("class", "x blind axis inside")
					.attr("x1", 0)
					.attr("x2", gartnerWidth)
					.attr("y1", gartnerHeight/2)
					.attr("y2", gartnerHeight/2)
					;
					
				// y axis + helpers
				gartnerContext.append("g")
					.attr("class", "y axis")
					.attr("transform", "translate(0," + 0 + ")")
					.call(yGartnerAxis)
					;
						
				gartnerContext.append("line")
					.attr("class", "y blind axis inside")
					.attr("x1", gartnerWidth / 2)
					.attr("x2", gartnerWidth / 2)
					.attr("y1", 0)
					.attr("y2", gartnerHeight)
					;
					
				gartnerContext.append("line")
					.attr("class", "y blind axis")
					.attr("x1", gartnerWidth)
					.attr("x2", gartnerWidth)
					.attr("y1", 0)
					.attr("y2", gartnerHeight)
					;
					
				/* x axis arrow */
				gartnerContext.append("text")
					.attr("class", "legend")
					.attr("text-anchor", "start")
					.attr("transform", "translate("+ (0 + 5) +"," + (gartnerHeight + 18) + ")")
					.text("Closing Rate");

				gartnerContext.append("svg:path")
					.attr("class", "arrow")
					.attr("d", function() {
						var _x = 5;
						var _l = gartnerWidth/3;
						var _y = gartnerHeight + 4;
						return "M"+(_x)+","+ _y +"L"+(_x+_l)+","+_y+"L"+(_x+_l-5)+","+(_y+3)+"L"+(_x+_l-5)+","+_y;
					})
					;

				/* y axis arrow */
				gartnerContext.append("text")
					.attr("class", "legend")
					.attr("text-anchor", "start")
					.attr("transform", "translate("+ (0 - 8) +"," + (gartnerHeight - 5) + ")rotate(-90)")
					.text("Sales");
									
				gartnerContext.append("svg:path")
					.attr("class", "arrow")
					.attr("d", function() {
						var _x = -4;
						var _l = gartnerHeight/3;
						var _y = gartnerHeight - 5;
						return "M"+(_x)+","+ _y +"L"+(_x)+","+(_y-_l)+"L"+(_x-3)+","+(_y-_l+5)+"L"+(_x)+","+(_y-_l+5);
					})
					// .attr("transform", "translate("+(0-4-gartnerWidth/2-50)+","+(gartnerHeight - 9 + 30)+")rotate(-90)")
					;
					// .attr("marker-end", "url(#end)");
			}

			// draw diagram outline
			createGartner();

			// draw timeline
			createTimeline();
			
			// draw diagram initially with all data
			renderCircles(parseData(allData, new Date("7-1-2015"), new Date("10-1-2015")));
	};

	return render;
});