/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
export class Configuration
{
	config = 
    {
		"startIndex": 0,
		"startLambda": 0.5,
		
		"angleIncrement": 5,
		"timerMilliseconds": 10,
		"canvasBorderSize": 20,
		
		"csvDelimiter": ' ',

		"polygon":
		{
			"color": '#000000',
			"colorDesignMode": '#ff0000',
			"lineWidth": 2,
		},
		"bezier":
		{
			"bezierDegree": 3,
			"color": '#C00000',
			"colorDegreeGreater3": '#00FF00',
			"colorControlPoint": '#999500',
			"lineWidth": 2,
			"lineDash": [2,3],
		},
		"trajectories":
		{
			"lineWidth": 1,
			"lineDash": [1,4],
		},
		"chart":
		{
			"radiusPoint": 3,
			"radiusPointBatch": 2,
			"maxPointsScatterdiagramPerSeries": 1000,
		},
		"balls":
		{
			"radius": 5,
			"radiusAdd": 5,
			"colors": [	'#0095DD', '#000000', '#00ff00', '#ff0000', '#c0c0c0', 
						'#000080', '#008000', '#ff00ff', '#808080', '#800000' ],
		},
		"designBackground":
		{
			minorLines:
			{
				separation: 5,
				color: '#C0C0C0'
			},
			majorLines: 
			{
				separation: 30,
				color: '#A0A080'
			}
		},
	}
	
	constructor() 
	{
	}
	
	getConfig()
	{
		return this.config;
	}
}
