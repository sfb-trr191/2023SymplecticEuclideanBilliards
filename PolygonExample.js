/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from "./Point.js";
import { DataConversion } from './DataConversion.js'; 

export class PolygonExample 
{
	rotateAngle = 0;

	minWidth = 0;
	diffNoBorder = 0;
	cosangle = 1.0;
	sinangle = 0.0;
	
	borderSize = 0;
	
	constructor(canvas, angle, sizePercent = 75, bordersize = 20) 
	{
		this.#setBaseParameter(canvas, angle, sizePercent, bordersize);
	}
	
	#setBaseParameter(canvas, angle, size, bordersize)
	{
		// this.drawSize = size;
		// this.bascanvas = canvas;
		
		this.borderSize = bordersize;
		this.rotateAngle = angle;
		this.minWidth = Math.min(canvas.width, canvas.height);
		
		let w1 = this.minWidth / 2.0;

		let distFromCanvas = w1 - 
					new DataConversion().mapIntervalFromTo(size, 0, 100, 
														   this.borderSize, w1 - this.borderSize);
		// this.distFromCanvas = canvas.width/2 - (size / 100.0 *(canvas.width/2.0 - 2*this.borderSize) + this.borderSize);

		let x1 = distFromCanvas;
		let x2 = this.minWidth - distFromCanvas;
		
		this.cosangle = Math.cos(this.rotateAngle);
		this.sinangle = Math.sin(this.rotateAngle);
		
		this.diff = (x2 - x1) / 2; // half x-width of drawing area
		this.add  = (x1 + x2) / 2; // x-component of mid point of canvas
		
		this.diffNoBorder = w1;
	}
		
	affineTransform(x, y)
	{
		// rotate by rotateAngle, scale by diff and shift by (xadd, yadd)
		let xs = (x * this.cosangle - y * this.sinangle) * this.diff + this.add;
		let ys = (x * this.sinangle + y * this.cosangle) * this.diff + this.add;
		return new Point(xs, ys);
	}
	
	affineTransformPoint = ((point) => this.affineTransform(point.x, point.y));

 	affineTransformNoBorder(x, y)
	{
		// rotate by rotateAngle, scale and shift  by (this.diffNoBorder, this.ydiffNoBorder) 
		let xs = (x * this.cosangle - y * this.sinangle) * this.diffNoBorder + this.diffNoBorder;
		let ys = (x * this.sinangle + y * this.cosangle) * this.diffNoBorder + this.diffNoBorder;
		return new Point(xs, ys);
	}
	
	affineTransformPointNoBorder = ((point) => this.affineTransformNoBorder(point.x, point.y));
	
	RegularPolygon(n)
	{
		let poly = [];
		
		for (let i = 0; i < n; i++)
			poly[i] = new Point(Math.cos(2.0 * Math.PI * i / n), Math.sin(2.0 * Math.PI * i / n));
			
		return poly.map(point => this.affineTransformPoint(point));
	}
	
	RegularStar(n)
	{
		const radius1 = 1.0;
		const radius2 = 0.6;
		n *= 2;
		let poly = [];
		let x, y, r;
		
		for (let i = 0; i < n; i++)
		{
			r = (i % 2 == 0) ? radius1 : radius2;

			x = r * Math.cos(2.0 * Math.PI * i / n);
			y = r * Math.sin(2.0 * Math.PI * i / n);
			poly[i] = new Point(x, y);
		}
		return poly.map(point => this.affineTransformPoint(point));
	}

	Circle()
	{
		const radius = 1.0;

		let n = 300;
		let poly = [];
		let x, y;

		for (let i = 0; i < n; i++)
		{
			x = radius * Math.cos(2.0 * Math.PI * i / n);
			y = radius * Math.sin(2.0 * Math.PI * i / n);

			poly[i] = new Point(x, y);
		}
		return poly.map(point => this.affineTransformPoint(point));
	}
	
	Ellipse()
	{
		const radius1 = 1.0;
		const radius2 = 0.8;
		let n = 300;
		let poly = [];
		let x, y;

		for (let i = 0; i < n; i++)
		{
			x = radius1 * Math.cos(2.0 * Math.PI * i / n);
			y = radius2 * Math.sin(2.0 * Math.PI * i / n);

			poly[i] = new Point(x, y);
		}
		return poly.map(point => this.affineTransformPoint(point));
	}
		
	// see: https://arxiv.org/pdf/1912.09404.pdf
	// or https://arxiv.org/abs/1912.09404
	Quad1Polygon()
	{
		let p = [{x:1, y:5/9}, {x:-1, y:5/9},{x:-1, y:-1/9},{x:-1/3, y:-7/9}]; // counterwise
		return p.map(point => this.affineTransformPoint(point));
	}

	// see: https://arxiv.org/pdf/1912.09404.pdf
	PenthousePolygon()
	{
		let p = [{x:0.75, y:0.75}, {x:-0.75, y:0.75},{x:-0.75, y:-0.5},
				  {x:0.25, y:-1.0},{x:0.75, y: -0.5}];
				  
		return p.map(point => this.affineTransformPoint(point));
	}
	
	SimpleNonConvex()
	{
		let p = [];
	    p[0] = new Point(1, -1);
	    p[1] = new Point(1, 1);
	    p[2] = new Point(0.7, -0.4);
	    p[3] = new Point(-1, 1);
	    p[4] = new Point(0.5, -1);
	    
	    return p.map(point => this.affineTransformPoint(point));
	}
	
	SimpleConvex()
	{
		let p = [];
	    p[0] = new Point(1, -0.7);
	    p[1] = new Point(1, 1);
	    p[2] = new Point(-1, 1);
	    p[3] = new Point(-1, -0.8);
	    p[4] = new Point(-0.7, -1);

		return p.map(point => this.affineTransformPoint(point));
	}
	
	SawTooth(n, h1 = 0.3, h2 = 0.4)
	{
		n = Math.max(n, 2);

		h1 = Math.min(0.49, h1);
		h2 = Math.min(0.49, h2);

		let p = [];
		let d = 2.0 / n;
		let x, y;
		
		p[0] = new Point(1.0, (n % 2 == 1) ? 1.0 : 1.0 - h2);

		for (let i = 0; i < n + 1; i++)
		{
			x = 1.0 - i * d;
			y = (i % 2 == 1) ? -1.0 + h2 : -1.0;

			p[i+1] = new Point(x, y);
		}
		
		for (let i = 0; i < n; i++)
		{
			x = -1 + i * d;
			y = (i % 2 == 0) ? 1.0 - h1 : 1.0;

			p[n + 2 + i] = new Point(x, y);
		}
		return p.map(point => this.affineTransformPoint(point));
	}

	Trapezoid()
	{
		let p = [];
	    p[0] = new Point(0.5, -1.0);
	    p[1] = new Point(1.0, 1.0);
	    p[2] = new Point(-1.0, 1.0);
	    p[3] = new Point(-0.5, -1.0);
		
		return p.map(point => this.affineTransformPoint(point));	    
	}

	Rectangle()
	{
		let p = [];
	    p[0] = new Point(1.0, -1.0);
	    p[1] = new Point(1.0, 1.0);
	    p[2] = new Point(-1.0, 1.0);
	    p[3] = new Point(-1.0, -1.0);
	    
		return p.map(point => this.affineTransformPoint(point));	
	}
   
	Crossing()
	{
		let p = [];
		p[0] = new Point(0.9, -0.9);
		p[1] = new Point(-1.0, 1.0);
		p[2] = new Point(1.0, 1.0);
		p[3] = new Point(-1.0, -1.0);
		
		return p.map(point => this.affineTransformPoint(point));	
	}
   
    EinsteinTiles()
	{
		const radius = 0.6;
		// see: https://www.spektrum.de/pdf/hobby-mathematiker-findet-die-lang-ersehnte-einstein-kachel/2079771
		// and: https://interestingengineering.com/innovation/an-einstein-tile-mathematicians-discover-pattern-that-never-repeats
		let p = [];

		let r = radius; // Circumscribed circle radius of the base hexagon
		let ri = radius * Math.sqrt(3) / 2; // Incircle radius of the base hexagon
		// let a = 2 * Math.sqrt(r * r - ri * ri);
		let a = radius; // Length of the perimeter edge of the base hexagon

		// 		p[0]  = new Point(r + a / 2.0, 0.0); 
		// 		p[1]  = new Point(2.0 * ri * Math.cos(11.0 / 6.0 * Math.PI), 2.0 * ri * Math.sin(11.0 / 6.0 * Math.PI));
		// 		p[2]  = new Point((r + a / 2.0) * Math.cos(5.0 / 3.0 * Math.PI), (r + a / 2.0) * Math.sin(5.0 / 3.0 * Math.PI));
		// 		p[3]  = new Point(r * Math.cos(5.0 / 3.0 * Math.PI), r * Math.sin( 5.0 / 3.0 * Math.PI));
		// 		p[4]  = new Point(0, -ri);
		// 		p[5]  = new Point(0, 0);		
		// 		p[6]  = new Point(ri * Math.cos(5.0 / 6.0 * Math.PI), ri * Math.sin(5.0 / 6.0 * Math.PI));
		// 		p[7]  = new Point(r * Math.cos(2.0 / 3.0 * Math.PI), r * Math.sin(2.0 / 3.0 * Math.PI));
		// 		p[8]  = new Point(r * Math.cos(1.0 / 3.0 * Math.PI), r * Math.sin(1.0 / 3.0 * Math.PI));
		// 		p[9]  = new Point(ri * Math.cos(1.0 / 6.0 * Math.PI), ri * Math.sin(1.0 / 6.0 * Math.PI));
		// 		p[10] = new Point(2.0 * ri * Math.cos(1.0 / 6.0 * Math.PI), 2.0 * ri * Math.sin(1.0 / 6.0 * Math.PI));
		// 		p[11] = new Point(r + a + a * Math.sin(Math.PI / 12.0), p[9].y);
		// 		p[12] = new Point(r + a, 0.0); 

		// optimized:
		let pi_11_6 = 11.0 / 6.0 * Math.PI; let sin_11_6 = Math.sin(pi_11_6); 	let cos_11_6 = Math.cos(pi_11_6);
		let pi_5_3 = 5.0 / 3.0 * Math.PI;	let sin_5_3 = Math.sin(pi_5_3);		let cos_5_3 = Math.cos(pi_5_3);
		let pi_5_6 = 5.0 / 6.0 * Math.PI;	let sin_5_6 = Math.sin(pi_5_6); 	let cos_5_6 = Math.cos(pi_5_6);
		let pi_1_3 = 1.0 / 3.0 * Math.PI;	let sin_1_3 = Math.sin(pi_1_3);		let cos_1_3 = Math.cos(pi_1_3);
		let pi_2_3 = 2.0 / 3.0 * Math.PI;	let sin_2_3 = Math.sin(pi_2_3); 	let cos_2_3 = Math.cos(pi_2_3);
		let pi_1_6 = 1.0 / 6.0 * Math.PI;	let sin_1_6 = Math.sin(pi_1_6);		let cos_1_6 = Math.cos(pi_1_6);
		let pi_1_12 = 1.0 / 12.0 * Math.PI;	let sin_1_12 = Math.sin(pi_1_12); 	let cos_1_12 = Math.cos(pi_1_12);
		
		p[0]  = new Point(r + a / 2.0 - ri, 0.0); 
		p[1]  = new Point(2.0 * ri * cos_11_6 - ri, 2.0 * ri * sin_11_6);
		p[2]  = new Point((r + a / 2.0) * cos_5_3 - ri, (r + a / 2.0) * sin_5_3);
		p[3]  = new Point(r * cos_5_3 - ri, r * sin_5_3);
		p[4]  = new Point(0 - ri, -ri);
		p[5]  = new Point(0 - ri, 0);		
		p[6]  = new Point(ri * cos_5_6 - ri, ri * sin_5_6);
		p[7]  = new Point(r * cos_2_3 - ri, r * sin_2_3);
		p[8]  = new Point(r * cos_1_3 - ri, r * sin_1_3);
		p[9]  = new Point(ri * cos_1_6 - ri, ri * sin_1_6);
		p[10] = new Point(2.0 * ri * cos_1_6 - ri, 2.0 * ri * sin_1_6);
		p[11] = new Point(r + a + a * sin_1_12 - ri, p[9].y);
		p[12] = new Point(r + a - ri, 0.0); 

		return p.map(point => this.affineTransformPoint(point));	
	}
	
	fromMemory(data) 
	{
		if (data == null) return;
		let dc = new DataConversion();
		
		let mapIt = (val, max) => dc.mapIntervalFromTo(val, 0, max, -1.0, 1.0);
		return data.map(p => this.affineTransformNoBorder(mapIt(p.x, this.minWidth), 
														  mapIt(p.y, this.minWidth)));
	}
	
	rotateBack(x, y) // rotate clockwise with midpoint (diffNoBorder, diffNoBorder)
	{
	    // inverse of 	(cosangle  - sinangle)   is   (cosangle   sinangle)
		// 				(sinangle    cosangle)        (- sinangle cosangle)

		x -= this.diffNoBorder;
		y -= this.diffNoBorder;

		let xs = (this.cosangle * x + this.sinangle * y)  + this.diffNoBorder;
		let ys = (- this.sinangle * x + this.cosangle * y) + this.diffNoBorder;
		return new Point(xs, ys);
	}
}
