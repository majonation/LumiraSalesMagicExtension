define("vizards_viz_ext_salesmagic-src/js/flow", ["vizards_viz_ext_salesmagic-src/js/module"], function(moduleFunc) {
	var flowRegisterFunc = function() {
		var flow = sap.viz.extapi.Flow.createFlow({
			id: "vizards.viz.ext.salesmagic",
			name: "Vizards Sales Magic",
			dataModel: "sap.viz.api.data.CrosstableDataset",
			type: "BorderSVGFlow"
		});

		var titleElement = sap.viz.extapi.Flow.createElement({
			id: "sap.viz.chart.elements.Title",
			name: "Title"
		});
		flow.addElement({
			"element": titleElement,
			"propertyCategory": "title",
			"place": "top"
		});

		var element = sap.viz.extapi.Flow.createElement({
			id: "vizards.viz.ext.salesmagic.PlotModule",
			name: "Vizards Sales Magic Module"
		});
		element.implement("sap.viz.elements.common.BaseGraphic", moduleFunc);

		/*Feeds Definition*/
		var ds1 = {
			"id": "vizards.viz.ext.salesmagic.PlotModule.DS1",
			"name": "start,due,order,repId",
			"type": "Dimension",
			"min": 0, //minimum number of data container
			"max": 2, //maximum number of data container
			"aaIndex": 1
		};
		element.addFeed(ds1);

		var ms1 = {
			"id": "vizards.viz.ext.salesmagic.PlotModule.MS1",
			"name": "estimated,revenue,totalRevenue",
			"type": "Measure",
			"min": 0, //minimum number of measures
			"max": Infinity, //maximum number of measures
			"mgIndex": 1
		};
		element.addFeed(ms1);

		element.addProperty({
			name: "colorPalette",
			type: "StringArray",
			supportedValues: "",
			defaultValue: d3.scale.category20().range().concat(d3.scale.category20b().range()).concat(d3.scale.category20c().range())
		});

		flow.addElement({
			"element": element,
			"propertyCategory": "plotArea"
		});
		sap.viz.extapi.Flow.registerFlow(flow);
	};
	flowRegisterFunc.id = "vizards.viz.ext.salesmagic";
	return {
		id: flowRegisterFunc.id,
		init: flowRegisterFunc
	};
});