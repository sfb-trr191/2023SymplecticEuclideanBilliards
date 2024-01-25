/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from './Point.js';
import { Line } from './Line.js';
import { CurvePoint }  from './CurvePoint.js';
import { Geometry2d } from './Geometry2d.js';
import { CompareIt } from './CompareIt.js';
import { IntersectionPoint } from './IntersectionPoint.js';
import { CubicResult, Utils } from './Utils.js';
import { BezierUtils } from './BezierUtils.js'

export class BilliardsStep
{
	Polygon;
	BoundingBox;
	bezierSegments;
	useBezier;
	useSymplectic;
	
	ballStartPoint;
	ballEndPoint;
	ballLine;
	intersectionIndex;
	
	constructor(boundingbox, polygon, bsegs, startindex, lambda = 0.5, angle = 10.0, bezier = false, symplectic = false) 
	{
		this.BoundingBox = boundingbox;
		this.Polygon = polygon;
		if (polygon.length < 3) 
		{
			// throw new Error("Polygon must have at least 3 points!");
			return;
		}
		this.bezierSegments = bsegs;
        this.useBezier = bezier;
        this.useSymplectic = symplectic;

		this.intersectionIndex = startindex;
		this.ballStartPoint = this.calcStartPoint(lambda, startindex, this.useBezier);
		this.init(lambda, angle);
	}
	
	radians = (degree) => {	let rad = (degree % 180) * Math.PI / 180; 
							if (rad < 0) rad += Math.PI;
							return rad; 
						  };
						  
	degrees = (radian) => {
							radian = radian % Math.PI;
							if (radian < 0) radian += Math.PI;
							let degree = 180.0 * radian / Math.PI;
							return degree;
						   };
	
	init(lambda, angle) 
	{
		let i = this.intersectionIndex % this.Polygon.length;
		let j = (i + 1) % this.Polygon.length;
		this.intersectionIndex = i;

		let radian = this.radians(angle);

		if (this.useBezier)
		{
			if (CompareIt.aboutEquals(radian, 0)) 
			{
				// MessageBox.Show("Cannot proceed, tangent outside bezier curve and angle = 0°, changed to 1°");
				this.init(lambda, 1);
				return;
			}
			    
			let b = BezierUtils.calcBezier(this.ballStartPoint.t, this.bezierSegments[this.intersectionIndex]);
			// calc the first derivate of bezier curve at ballStartPoint
			let bdev = BezierUtils.calcBezierDerivate(this.ballStartPoint.t,
													  this.bezierSegments[this.intersectionIndex]);
			// tangent(t) = b(t0) + bdev(t0)(t - t0)
			let secondPoint = new Point(b.x + bdev.x, b.y + bdev.y);
			this.ballLine = this.startLine(new Line(b, secondPoint), b, radian);
		}	
		else
		{
			if (CompareIt.aboutEquals(radian, 0))  // special: angle = 0°
				this.ballLine = new Line(this.Polygon[i], this.Polygon[j]);
			else
				this.ballLine = this.startLine(new Line(this.Polygon[i], this.ballStartPoint.P), 
											   this.ballStartPoint.P, radian);
		}
		this.ballEndPoint = this.ballStartPoint;
	}
	
	bezierTangent(t0, bseg)
	{
		let point = BezierUtils.calcBezier(t0, bseg);
	   
		let bdev = BezierUtils.calcBezierDerivate(t0, bseg);  // first derivate a ballStartPoint
		// PointD secondPoint = b + bdev; // tangente(t) = b(t0) + bdev(t0)(t - t0)
		let secondPoint = new Point(point.x + (2.0 - t0) * bdev.x, point.y + (2.0 - t0) * bdev.y);

		return new Line(point, secondPoint);
	}
	
	/// Calculates the new ball line composed by new ballStartPoint and ballEndPoint
	/// Both points lie on two different border lines of the polygon
	/// intersectionIndex is the index of the last ballEndPoint on input.
	/// After newBallDirection() the intersectionIndex is the index of the border line in ballEndPoint
	newBallDirection()
	{
		try
		{
			return this.useSymplectic ? this.newBallDirectionSymplectic() : this.newBallDirectionEuklid();
		}
		catch (error)
		{
			return new Point(0.0, 0.0); // stay with the current ballLine
		}
	}
	
	first = true;
	lastStartPoint = null;
	lastLength = 0;
	lastIndex = 0;
	
	newBallDirectionSymplectic()
	{
		if (this.first)  // start with a predefined angle and euklidian billard in the first step
		{
			this.first = false;
			this.lastStartPoint = new Point(this.ballStartPoint.P);
			this.lastIndex = this.intersectionIndex;

			let p = this.newBallDirectionEuklid();
			this.lastLength = p.y;
			return new Point(0, this.lastLength);	
		}
		
		let j = this.intersectionIndex % this.Polygon.length;
		let k = (j + 1) % this.Polygon.length;

		let line = null;
		if (this.useBezier)
		{
			let borderline = this.bezierTangent(this.ballEndPoint.t, this.bezierSegments[j]);
			line = this.reflexionLineSymplectic(borderline.p1, borderline.p2, this.lastStartPoint);
		}
		else
		{
			let j1 = this.lastIndex;
			let k1 = (j1 + 1) % this.Polygon.length;
			// test parallel to lastline
		    let ptest = Geometry2d.calcIntersectionPoint(new Line(this.Polygon[j1], this.Polygon[k1]), new Line(this.Polygon[j], this.Polygon[k]));
		    if (ptest == null)
		    {
		    	this.lastIndex = this.intersectionIndex;
		    	this.intersectionIndex = j1;
		    	
		    	this.ballEndPoint = new CurvePoint(this.lastStartPoint, 0.0);
		    	this.lastStartPoint = new Point(this.ballStartPoint.P);
		    	this.ballLine = new Line(new Point(this.ballStartPoint.P), this.ballEndPoint.P);
		    	return new Point(this.lastLength, this.lastLength);	
		    }
			line =	this.reflexionLineSymplectic(this.Polygon[j], this.Polygon[k], this.lastStartPoint);
		}
		this.ballStartPoint = this.ballEndPoint;
		this.ballStartPoint.t = 0.0;
		
		let intersections = (this.useBezier) ? this.calcAllBezierIntersectionPoints(line, this.ballStartPoint.P, -1) :
										  this.calcAllPolygonIntersectionPoints(line, this.ballStartPoint.P, j);
 
		if (intersections.length == 0) 
		{
			return new Point(0.0, 0.0); // stay with the current ballLine
			// throw "No Endpoint found!";
		}

		let sortedlist = intersections.sort((a, b) => b.Distance - a.Distance); // maximize first
		let p = this.selectEndPoint(sortedlist, this.lastStartPoint);
		if (p != null) 
		{
			this.lastIndex = this.intersectionIndex;
			this.lastStartPoint = new Point(this.ballStartPoint.P);
	
			this.intersectionIndex = p.Index;
			this.ballEndPoint = new CurvePoint(p.Point, p.t0);
			this.ballLine = new Line(new Point(this.ballStartPoint.P), this.ballEndPoint.P);
		} 
		else 
		{
			throw new Error("No Endpoint found, mutiple points, no match!");
		}
		let tmplen = this.lastLength;
		this.lastLength = this.calcLengthBallLine(this.ballLine);
		return new Point(tmplen, this.lastLength);
	}
	
	newBallDirectionEuklid()
	{
		let j = this.intersectionIndex % this.Polygon.length;
		let k = (j + 1) % this.Polygon.length;
		let angle = 0;
		
		// bezier: calc Tangent
		let borderline = (this.useBezier) ? this.bezierTangent(this.ballEndPoint.t, this.bezierSegments[j]) :
											new Line(this.Polygon[j], this.Polygon[k]);

		[this.ballLine, angle] = this.reflexionLine(this.ballLine, borderline, this.ballEndPoint.P);
		this.ballStartPoint = this.ballEndPoint;

		if (this.ballLine == borderline) 
		{
			let dist = Geometry2d.pointsEuklidDistance(this.ballStartPoint.P, this.bezierSegments[j][0]);
			if (dist === 0) 
				this.ballEndPoint = new CurvePoint(new Point(this.bezierSegments[k][0]), 1.0);
			else 
				this.ballEndPoint = new CurvePoint(new Point(this.Polygon[j]), 1.0);

			return [this.ballLine, 0.0];
		}

		let intersections = (this.useBezier) ? this.calcAllBezierIntersectionPoints(this.ballLine, this.ballStartPoint.P, j) :
											   this.calcAllPolygonIntersectionPoints(this.ballLine, this.ballStartPoint.P, j);
		if (intersections.length == 0) // || intersections.length == 1)
			return new Point(angle, 0.0); // stay with the current ballLine
			// throw "Bezier curve, no Endpoint found, mutiple points, no match!";

		var sortedlist = intersections.sort((a, b) => a.Distance - b.Distance); // minimum first
		if (this.useBezier && CompareIt.aboutEquals(sortedlist[0].Distance, 0.0))
			sortedlist.splice(0, 1); // this is the startpoint itself
			
		var p = this.selectEndPoint(sortedlist, this.ballStartPoint.P);
		if (p != null)
		{
			this.ballEndPoint = new CurvePoint(p.Point, p.t0);
			this.ballLine = new Line(new Point(this.ballStartPoint.P), this.ballEndPoint.P);
			this.intersectionIndex = p.Index;
		}
		else
			throw new Error("Bezier curve, no Endpoint found, mutiple points, no match!");
			
		return new Point(angle, this.calcLengthBallLine(this.ballLine));
	}

	calcStartPoint(lambda, index, bezier = false)
	{
		lambda = Math.max(0.0, Math.min(1.0, lambda));  // 0 <= lambda <= 1

		if (bezier)
		{
			let bseg = this.bezierSegments[index];
			let p = BezierUtils.calcBezier(lambda, bseg);
			return new CurvePoint(p, lambda);
		}
		else
		{
			let p1 = this.Polygon[index];
			let p2 = this.Polygon[(index + 1) % this.Polygon.length];
			
			if (CompareIt.pointsAboutEqual(p1, p2))
				return null; // throw "Both Points are identical!";

			let x = (1.0 - lambda) * p1.x + lambda * p2.x;
			let y = (1.0 - lambda) * p1.y + lambda * p2.y;
			return new CurvePoint(x, y, lambda);
		}		
	}
   
    reflexionLine(line, borderline, reflexionpoint)
    {
        // m1*x+b1 trifft auf m2*x+b2 mit dem Einfallswinkel beta
        // zurückgegeben wird die durch den Ausfallswinkel an m2*x+b2 bestimmte Gerade zu m1*x+b1
        // Zuerst Schnittwinkel bestimmen
        // m1 * m2 = -1 gesondert behandeln, Geraden sind orthogonal

        // calculation of intersection angle and differential angle see:
        // https://de.wikipedia.org/wiki/Gerade#Schnittwinkel_zwischen_zwei_Geraden
        // https://rechneronline.de/winkel/einfallswinkel.php

		let borderline_a = borderline.p1.y - borderline.p2.y; // borderline.a;
		let borderline_b = borderline.p2.x - borderline.p1.x; // borderline.b;

		let line_a = line.p1.y - line.p2.y;
		let line_b = line.p2.x - line.p1.x;

	    // double denom_beta = line_a * borderline_a + line_b * borderline_b;
		let h1 = borderline_a * line_b;
		let h2 = line_a * borderline_b;

        if (CompareIt.aboutEquals(h1, h2)) // special case: beta = 0°
        {
            return [borderline, 0.0];
        }

        let beta1 = line_a * borderline_a;
        let beta2 = -line_b * borderline_b;

        if (CompareIt.aboutEquals(beta1, beta2)) // 90°: reflexionline = ballline
        {
            return [line, 90.0];
        }
        let tan_beta = (h1 - h2) / (beta1 - beta2);

        let radian = Math.atan(tan_beta);
        let angle = this.degrees(radian);

        if (CompareIt.aboutEquals(borderline_b, 0.0)) // Polygon line parallel to y-axis; alpha is 90°
        {
            // resulting angle: PI/2 - beta
            // as tan(PI/2 - beta) = 1 / tan(beta) handle the case 'tan(beta) = 0' separately:

            if (CompareIt.aboutEquals(tan_beta, 0.0))
            {
                return [borderline, angle];
            }
            else
            {
                let m = 1.0 / tan_beta;
                let b1 = reflexionpoint.y - m * reflexionpoint.x;
                return [new Line(reflexionpoint, 
								 new Point(reflexionpoint.x + 1, m * (reflexionpoint.x + 1) + b1)), 
						angle];
            }
        }

        let tan_alpha = (borderline.p2.y - borderline.p1.y) / (borderline.p2.x - borderline.p1.x);

        // delta = alpha - beta;
        let denom_delta = (1.0 + tan_alpha * tan_beta);

        if (CompareIt.aboutEquals(denom_delta, 0.0)) // new line parallel to y-axis
        {
        	let line1 = new Line(reflexionpoint, new Point(reflexionpoint.x, reflexionpoint.y + 1));
            return [line1, angle];
        }

        let tan_delta = (tan_alpha - tan_beta) / denom_delta;
        let b = reflexionpoint.y - tan_delta * reflexionpoint.x; 

        let lp = new Line(reflexionpoint, new Point(reflexionpoint.x + 1,
                                                     tan_delta * (reflexionpoint.x + 1) + b));
        return [lp, angle];
    }

    
    startLine(borderline, point, angleRad)
	{
		let m, b;
		if (CompareIt.pointsAboutEqual(borderline.p1, borderline.p2))
			return null;

		if (CompareIt.aboutEquals(angleRad, Math.PI / 2.0))    // angle = 90°
		{
			if (CompareIt.aboutEquals(borderline.p1.y, borderline.p2.y)) // parallel to x-axis
			{
				return new Line(point, new Point(point.x, point.y + 1));
			}
			else 		
			if (CompareIt.aboutEquals(borderline.p1.x, borderline.p2.x)) // parallel to y-axis
			{
				return new Line(point, new Point(point.x + 1, point.y));
			}
			else
			{
				let borderline_m = (borderline.p2.y - borderline.p1.y) / (borderline.p2.x - borderline.p1.x);
				m = -1.0 / borderline_m;
				b = point.y - m * point.x;
			}
		}
		else // angle != 90°
        {
        	let z = Math.tan(angleRad);
        	if (CompareIt.aboutEquals(borderline.p1.x, borderline.p2.x)) // parallel to y-axis
			{
				m = -1.0 / z;
				b = point.y - m * point.x;
			}
			else
			{
				let borderline_m = (borderline.p2.y - borderline.p1.y) / (borderline.p2.x - borderline.p1.x);
				let g = (1 + borderline_m * z);
				if (CompareIt.aboutEquals(g, 0.0))
				{
				   return new Line(point, new Point(point.x, point.y + 1)); // w2 - w1 = PI/2				   
				}
				else
				{
					m = (borderline_m - z) / (1.0 + borderline_m * z);
					b = point.y - m * point.x;
				}			
			}
        }
		return new Line(point, new Point(point.x + 1, m * (point.x + 1) + b));
	}

    calcAllPolygonIntersectionPoints(line, ballstart, index)
    {
        let list = [];

        for (let i = 0; i < this.Polygon.length; i++) 
        {
            if (i === index) continue;
            let j = (i + 1) % this.Polygon.length;

            let p0 = Geometry2d.calcIntersectionPoint(line, new Line(this.Polygon[i], this.Polygon[j]));
            let res = Geometry2d.isPointInsideOrOnBorder(p0, this.Polygon, this.BoundingBox);
            if (res == 0)
            {
                if (!CompareIt.pointsAboutEqual(p0, ballstart))
                {
                	let d = Geometry2d.pointsEuklidDistance(p0, ballstart);
                	list.push(new IntersectionPoint(p0, i, d, 1.0));
                }
            }
        }
        return list;
    }
    
    calcAllBezierIntersectionPoints(line, ballstart, index)
    {
    	let intersections = [];
		for (let i = 0; i < this.bezierSegments.length; i++)
		{
			let ipoints = BezierUtils.calcIntersections(line.p1, line.p2, this.bezierSegments[i], i);

			for (let m = 0; m < ipoints.length; m++)
				ipoints[m].Distance = Geometry2d.pointsEuklidDistance(ballstart, ipoints[m].Point);
			if (ipoints.length > 0)
				intersections = intersections.concat(ipoints);
		}
		return intersections;
	}
	
    selectEndPoint(sortedlist, ballpoint)
    {
    	// see: https://en.wikipedia.org/wiki/Jordan_curve_theorem
        // and https://scicomp.stackexchange.com/questions/16343/how-to-determine-if-a-point-is-outside-or-inside-a-curve
        
        if (sortedlist.length == 1)
			return sortedlist[0];
			
		if (this.useSymplectic)
		{
			for (let i = 0; i < sortedlist.length; i++) 
			{
				if (CompareIt.pointsAboutEqual(ballpoint, sortedlist[i].Point)) continue;
				return sortedlist[i];
			}
			return null;
		}
		
        if (this.useBezier)
        {
			for (let i = 0; i < sortedlist.length; i++) 
				if (BezierUtils.isLineSegmentInsideBezierCurve(ballpoint, sortedlist[i].Point, this.bezierSegments))
					return sortedlist[i];
        }
        else
        {
			for (let i = 0; i < sortedlist.length; i++) 
				if (Geometry2d.lineSegmentInsidePolygon(this.BoundingBox, this.Polygon, ballpoint, sortedlist[i].Point))
					return sortedlist[i];
        }
        return null;
    }

    calcLengthBallLine(line)
    {
        return Geometry2d.pointsEuklidDistance(line.p1, line.p2);
    }

	reflexionLineSymplectic(borderlineStart, borderlineEnd, startpoint)
	{
		let x2, y2;
		if (CompareIt.aboutEquals(borderlineStart.x, borderlineEnd.x))
		{
			x2 = startpoint.x;
			y2 = startpoint.y + 1.0;
		}
		else
		{
			x2 = startpoint.x + 1.0;
			y2 = (borderlineEnd.y - borderlineStart.y) / (borderlineEnd.x - borderlineStart.x) + startpoint.y;
		}
		return new Line(new Point(startpoint), new Point(x2, y2));
	}
	
}
