/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from "./Point.js";

export class DataConversion
{
	constructor()
	{
	}
	
	// as an alternative you can use node-csv from node.js (npm install csv)
	parseCsvFile(text, delimiter = ' ')
	{
		 // test if the file content is a valid csv with two numeric columns
		let firstrow = text.split(/\r\n|\n|\r/, 1);
		if (firstrow.length < 1) return null;
		
		let arr = firstrow[0].trim().split(delimiter);
		
		if ((arr.length >= 1 && arr[0].startsWith('#')) || (arr.length == 2)) 
		    return  text.split(/\r\n|\n|\r/)
						.filter(row => row.trim() != '' && row.trim()[0] != '#')   // use # in first column as a comment - widly used
						.map(row => new Point(row.split(delimiter).map(item => Number(item)))); 
		else
			return null;
			
		// here is the long version which is simpler to understand
// 		let rows = text.split(/\r\n|\n|\r/);
// 		let pointArray = [];
// 		let s = '';
// 		for (let i = 0; i < rows.length; i++)
// 		{
// 			s = rows[i].trim();
// 			if (s == '') continue;
// 			let [x,y] = s.split(delimiter);
// 			pointArray.push(new Point(Number(x), Number(y)));
// 		}
// 		return pointArray;
	}

	normalizeData(a) // maps the vector of Points to [-1, 1] x [-1, 1]
	{
		// using the min and the max values for x and y Komponents to build the source square
		var vx = a.map(val => val.x);
		var vy = a.map(val => val.y);
		
		var xmin = Math.min(...vx);
		var xmax = Math.max(...vx);
		var ymin = Math.min(...vy);
		var ymax = Math.max(...vy);

		var max = Math.max(xmax, ymax);   // x, y are living in a square, that is the assumption here
		var min = Math.min(xmin, ymin)
		return a.map(p => new Point(this.mapIntervalFromTo(p.x, min, max, -1.0, 1.0), 
									this.mapIntervalFromTo(p.y, min, max, -1.0, 1.0)));
	}
	
	normalizeDataInCanvas(canvas, a)
	{
		let normdata = a.map(p => new Point(this.mapIntervalFromTo(p.x, 0, canvas.width, -1.0, 1.0), 
											this.mapIntervalFromTo(p.y, 0, canvas.height, -1.0, 1.0)));
		return normdata;								
	}

	mapIntervalFromTo(x, a1, b1, a2, b2) // linear maps x from the source intervall [a1,b1] to [a2,b2]
	{
		return ((b2 - a2) / (b1 - a1)) * (x - a1) + a2;
	}
	
	scaleToCanvas(canvas, data, size, bordersize = 20)
	{
		let distFromCanvas = canvas.width/2 - this.mapIntervalFromTo(size, 0, 100.0, bordersize, canvas.width/2 - bordersize);
		
		let xmin = distFromCanvas;
		let xmax = canvas.width - distFromCanvas;
		let ymin = distFromCanvas;
		let ymax = canvas.height - distFromCanvas;
		
		var vx = data.map(val => val.x);
		var vy = data.map(val => val.y);
		
		var sxmin = Math.min(...vx);
		var sxmax = Math.max(...vx);
		var symin = Math.min(...vy);
		var symax = Math.max(...vy);
		
		var source_max = Math.max(sxmax, symax);
		var source_min = Math.min(sxmin, symin);

		return data.map(p => new Point(this.mapIntervalFromTo(p.x, source_min, source_max, xmin, xmax), 
									   this.mapIntervalFromTo(p.y, source_min, source_max, ymin, ymax)));		
	}

}