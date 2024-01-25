/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from './Point.js';

export class CircleArc
{
	radius = 0;
	center = null;
	startPoint = new Point();
	endPoint = new Point();
	
	constructor(mp, r)
	{
		if (mp instanceof Point && r != null && r != 0)
		{
			this.center = mp;
			this.radius = r;
		}
		else if (mp != null && mp instanceof CircleArc)
		{
			this.radius = mp.radius;
			this.center = mp.center;
			this.startPoint = mp.startPoint;
			this.endPoint = mp.endPoint;
		}
	}
	
	From2PointsAndSagittaHeight(p1, p2, h)
	{
		if (h === 0.0) return this; // Not a valid circle
		
		// see: https://math.stackexchange.com/questions/441450/how-to-find-arc-center-when-given-two-points-and-a-radius/441517#441517
		this.startPoint = new Point(p1); // save points
		this.endPoint = new Point(p2); 
		
		let s = Math.hypot(p2.x - p1.x, p2.y - p1.y);
		let habs = Math.abs(h);
		let r = habs / 2 + s * s / (8 * habs); 
		
		let t = Math.sqrt(r * r / (s * s) - 0.25);
		if (h < 0) t = -t; // this is the center of the other possible circle !!!
		
		this.center = new Point((p1.x + p2.x) / 2 - t * (p2.y - p1.y), (p1.y + p2.y) / 2 + t * (p2.x - p1.x));
		this.radius = r;
		return this;
	}
	
	arcLength()
	{
		if (this.radius == 0.0) return 0.0;
		let s = Math.hypot(this.endPoint.x - this.startPoint.x, this.endPoint.y - this.startPoint.y);
		let r2 = 2.0 * this.radius;
		return r2 * Math.asin(s / r2);
	}

	calcAngle(p)
	{
		if (this.center == null || this.radius == 0.0) return 0;
		let alpha = Math.atan2(p.y - this.center.y, p.x - this.center.x);
		if (alpha < 0) alpha += 2 * Math.PI;
		return alpha; // always > 0
	}

	pointOnCircle(angle)
	{
		return new Point(this.center.x + this.radius * Math.cos(angle), this.center.y + this.radius * Math.sin(angle));
	}
}