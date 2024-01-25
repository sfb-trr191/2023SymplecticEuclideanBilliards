/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from "./Point.js";

export class Charts 
{
	scatterdiagram = null;
	canvas = null;
	
	constructor(id)
	{
		this.canvas = id;
		this.ctx = id.getContext("2d");

		// chart.js implementation .................................
		this.scatterdiagram = new Chart(this.ctx,
								{
									type: "scatter",
									datasetFill: false,
									data: 
									{
										datasets: []
									},
									options: 
									{
										animation: false, // disable animation here
										legend: {display: true},
										scales: 
										{
										  x: 
										  { 
										  	suggestedMin: 0, 
										  	suggestedMax: 1,
										  	title: 
										  	{ 
										  		display: true, 
										  		text: 'Angle' 
										  	}
										  },
										  y: 
										  { 
										  	suggestedMin: 0, 
											suggestedMax: 1,
											title: 
											{ 
												display: true, 
												text: 'Trajectory length' 
											}
										  }
										},
										plugins:
										{
											title: 
											{ 
												display: true,
												text: 'Symplectic Billiards - Trajectory length by angle', 
											}
										}
									}
								}); 
								
		//this.scatterdiagram.options.plugins.title.align = 'center';
	}

	setTitle = (title) => this.scatterdiagram.options.plugins.title.text = title;
	setSuggestedXMax = (xmax) => this.scatterdiagram.options.scales.x.suggestedMax = xmax;

	// so kann man die Optionen auch setzen:
	setAxisTitles(xtitle, ytitle)
	{
		let p = this.scatterdiagram.options.scales;
		p.x.title.display = true;
		p.x.title.text = xtitle;
		p.y.title.display = true;
		p.y.title.text = ytitle;
	}

	clearAllSeries()
	{
		this.scatterdiagram.data.datasets = [];
		// this.clear();
		this.update();
	}
	
	addChartData(label, color, radius = 2)
	{
		let series = [];
		// this.scatterdiagram.data.labels = ['Angle', 'Trajectory length'];
		this.scatterdiagram.data.datasets.push({
												label: label,
												backgroundColor: color,
												data: series,
												radius: radius
											});
		this.update();
		return series; //  the dataset
	}
	
	addDataPoint(series, infopoint)
	{
		if (series == null) return;
		if (infopoint == null) return;
		series[series.length] = infopoint;
		this.update();
	}
	
	addManyPoints(series, pointarray)
	{
		if (series == null) return;
		if (pointarray == null || pointarray == []) return;
		series.push(...pointarray);
		this.update();
	}
	
	clear()
	{
		// clear the chart background
// 		this.ctx.fillStyle = "green";
// 		this.ctx.fillRect(0, 0, 500, 500);
	}
	
	update = () => this.scatterdiagram.update();
	
}	
