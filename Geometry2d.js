/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import {Point} from './Point.js';
import {Line} from "./Line.js";
import { Rectangle } from './Rectangle.js';
import { CompareIt } from './CompareIt.js';

export class Geometry2d // base function of 2d
{
	constructor() {}

	// see: https://www.dbs.ifi.lmu.de/Lehre/GIS/SS2009/Skript/Kap-06.pdf
	// see: https://de.wikipedia.org/wiki/Gerade

	// Intersection point of two lines
	static calcIntersectionPoint(l1, l2)
	{
		// see Wiki: https://de.wikipedia.org/wiki/Gerade#Schnittpunkt_zweier_Geraden

		let delta1x = l1.p2.x - l1.p1.x; // delta1 = l1.p2 - l1.p1;
		let delta1y = l1.p2.y - l1.p1.y;

		let delta2x = l2.p2.x - l2.p1.x; // delta2 = l2.p2 - l2.p1;
		let delta2y = l2.p2.y - l2.p1.y;

		let det = delta1x * delta2y - delta1y * delta2x;
		if (CompareIt.aboutEquals(det, 0.0))
			return null; // lines are parallel

		let xs = (delta1x * (l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x) -
				  delta2x * (l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x)) / det;
		let ys = (delta1y * (l2.p1.x * l2.p2.y - l2.p1.y * l2.p2.x) -
				  delta2y * (l1.p1.x * l1.p2.y - l1.p1.y * l1.p2.x)) / det;

		return new Point(xs, ys);
	}

	static isPointInsideAlternate(point, polygon) 
	{
		if (point == null || polygon == null)
		  return -1;

		let res = -1;
		for (let i = 0; i < polygon.length; i++) 
		{
			let j = (i + 1) % polygon.length;
			let result = Geometry2d.tripleProductSign(point, polygon[i], polygon[j]);
			res *= result;
			if (res == 0)
				break;
		}
		return res;
	}
	
	static isPointInside(point, polygon)
	{
		// Jordan's theorem for closed curves 
		//  see Winding algorithm
		let list = []; // new List<IntersectionPoint>();
		let p2 = new Point(point.x + 1, point.y);  // erzeuge damit eine Gerade parallel zur x-Achse

		for (let i = 0; i < polygon.length; i++)
		{
			let j = (i+1) % polygon.length;
			let [p, s, t] = Geometry2d.calcIntersectionPointSeg(point, p2, polygon[i], polygon[j]);
			if (p != null && (t >= 0.0 && t <= 1.0))
				list.push(p);
		}
		let count = 0;
		for (let i = 0; i < list.length; i++)
		{
			if (list[i].x > point.x) // nur Punkte auf dem Strahl nach rechts!
				count++;
		}
		return (count % 2 != 0); // ungerade bedeutet hier: Punkt liegt innerhalb der geschlossenen Bezier Kurve
	}

	// Given 2 points p11, p12 forming a line and 2 points p21, p22 forming a second line
	// IntersectionPoint return the intersection point if it exists, null otherwise
	// The returned values of s1 and t1 indicate if the two line segments intersect:
	// if both s and t are between 0.0 and 1.0 both line segments intersects if one of them is between 0.0 and 1.0
	// the respective line segment intersects with the whole line of the other
	static calcIntersectionPointSeg(p11, p12, p21, p22)
	{
		// Siehe Wiki: https://de.wikipedia.org/wiki/Gerade#Gleichung_einer_Geraden_in_der_Ebene

		let delta1x = p12.x - p11.x;
		let delta1y = p12.y - p11.y;
		let delta2x = p22.x - p21.x;
		let delta2y = p22.y - p21.y;

		let det = delta1x * delta2y - delta1y * delta2x;
		if (CompareIt.aboutEquals(det, 0.0)) 
			return [null, -1, -1]; // lines are parallel

		let xs = (delta1x * (p21.x * p22.y - p21.y * p22.x) -
				  delta2x * (p11.x * p12.y - p11.y * p12.x)) / det;
		let ys = (delta1y * (p21.x * p22.y - p21.y * p22.x) -
				  delta2y * (p11.x * p12.y - p11.y * p12.x)) / det;

		// line segment intersection:
		// solving the linear equation system in s, t:
		
		// if a solution exists with 0 <= s,t <= 1, there is an intersection point of the two line segments
		// delta1x * s - delta2x * t = p21.x - p11.x
		// delta1y * s - delta2y * t = p21.y - p11.y

		let s1 = ((p21.x - p11.x) * delta2y - (p21.y - p11.y) * delta2x) / -det;
		let t1 = ((p21.y - p11.y) * delta1x - (p21.x - p11.x) * delta1y) / -det;

		return [new Point(xs, ys), s1, t1];
	}

	static tripleProductSign(p1, p2, p3) 
	{
		if (CompareIt.aboutEquals(p1.y, p2.y) && CompareIt.aboutEquals(p2.y, p3.y)) 
		{
			if ((p2.x <= p1.x && p1.x <= p3.x) || (p3.x <= p1.x && p1.x <= p2.x))
				return 0;
			  else
				return 1;
		}

		if (CompareIt.pointsAboutEqual(p1, p2))
			return 0;

		if (p2.y > p3.y) // exchange point 2 and 3
		{
			[p2, p3] = [p3, p2];
		}
		if (p1.y <= p2.y || p1.y > p3.y)
			return 1;

		let d1 = (p2.x - p1.x) * (p3.y - p1.y);
		let d2 = (p2.y - p1.y) * (p3.x - p1.x);

		if (CompareIt.aboutEquals(d1, d2))
			return 0;

		return Math.sign(d2 - d1);
	}
	
	// Regtangle which contains the polygon completely
	static calcBoundingBox(polygon)
	{
		let xmin = Number.POSITIVE_INFINITY;
		let ymin = Number.POSITIVE_INFINITY;
		let xmax = Number.NEGATIVE_INFINITY;
		let ymax = Number.NEGATIVE_INFINITY;

		for (let i = 0; i < polygon.length; i++)
		{
			let x = polygon[i].x;
			let y = polygon[i].y;

			if (x < xmin) xmin = x;
			if (x > xmax) xmax = x;

			if (y < ymin) ymin = y;
			if (y > ymax) ymax = y;
		}
		return new Rectangle(Math.floor(xmin), Math.floor(ymin), Math.ceil(xmax), Math.ceil(ymax));
	}

	static isOutsideBoundingBox(p, box)
	{
		if (box == null) return false;
		if (p == null) return true; 
		return (p.x < box.x0 || p.x > box.x1 || p.y < box.y0 || p.y > box.y1);
	}


	static lineSegmentInsidePolygon(boundingBox, polygon, startpoint, endpoint)
	{
		let lambda = 0.001; // Math.Min(1.0 / (double)Canvas.Width, 0.001);

		// create two points close to startpoint and enpoint
		let x1 = lambda * startpoint.x + (1.0 - lambda) * endpoint.x;
		let y1 = lambda * startpoint.y + (1.0 - lambda) * endpoint.y;
		let p1 = new Point(x1, y1);

		let x2 = (1.0 - lambda) * startpoint.x + lambda * endpoint.x;
		let y2 = (1.0 - lambda) * startpoint.y + lambda * endpoint.y;
		let p2 = new Point(x2, y2);

		// use the faster Winding algorithm here
 		return (Geometry2d.isPointInside(p1, polygon) &&  
				Geometry2d.isPointInside(p2, polygon));

		// both points are inside or on the border of the Polygon
		// if (Geometry2d.isPointInsideOrOnBorder(p1, polygon, boundingBox) >= 0 && 
		// 	   Geometry2d.isPointInsideOrOnBorder(p2, polygon, boundingBox) >= 0)
		// 		return true;
		// 	else
		// 		return false;
	}
	
	static isPointInsideOrOnBorder(point, polygon, boundingBox) // point in Polygon
	{
		if (Geometry2d.isOutsideBoundingBox(point, boundingBox))
			return -1;
		return Geometry2d.isPointInsideOrOnPolygonBorder(point, polygon);
	}

	static isPointInsideOrOnPolygonBorder(point, polygon) // point in Polygon
	{
		// see Wiki: https://de.wikipedia.org/wiki/Punkt-in-Polygon-Test_nach_Jordan
		// see also: https://de.wikipedia.org/wiki/Polygon#Punkt_im_Polygon
		// also: https://en.wikipedia.org/wiki/Point_in_polygon
		// Discussion and Winding number: https://web.archive.org/web/20130126163405/http://geomalgorithms.com/a03-_inclusion.html

		if (point == null || polygon == null)
			return -1;

		// returns: 1 inside, -1 outside, 0 on border
		// algorithmus by Jordan
		let res = -1;
		for (let i = 0; i < polygon.length; i++)
		{
			res *= Geometry2d.tripleProductSign(point, polygon[i], polygon[(i + 1) % polygon.length]);
			if (res == 0)
				break;
		}
		return res;
	}
   
	static Circumference(polygon)
	{
		let u = 0;
		let tx = 0.0, ty = 0.0;
		for (let i = 0; i < polygon.length; i++)
		{
			let j = (i + 1) % polygon.length;
			tx = polygon[j].x - polygon[i].x;
			ty = polygon[j].y - polygon[i].y;

			u += Math.hypot(tx, ty);
		}
		return u;
	}
	
	// L1 Norm
	static pointsL1Distance(p1, p2)
	{
		return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y); 
	}
		
	// L2 Norm
	static pointsEuklidDistance(p1, p2) 
	{
		if (p1 == null || p2 == null) return 0.0; 
		let dx = p2.x - p1.x;
		let dy = p2.y - p1.y;
		return Math.hypot(dx ,dy);
	}
	
	// L-infinity Norm
	static pointsMaxDistance(p1, p2)
	{
		return Math.max(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y)); 
	}
	
	
	static closestPointOnLineTo(p, p1, p2)
	{
		// https://de.wikipedia.org/wiki/Gerade#Abstand_zwischen_Punkt_und_Gerade

		if (p == null || p1 == null || p2 == null)
			return [new Point(), Number.POSITIVE_INFINITY];
			
		let a = p2.y - p1.y;
		let b = p1.x - p2.x;
		let c = (p2.x * p1.y - p1.x * p2.y);
		let distance = Number.POSITIVE_INFINITY;

		// p1 == p2
		if (CompareIt.pointsAboutEqual(p1, p2)) 
		{
			distance = Math.hypot(p.x - p1.x, p.y - p1.y);
			return [p1, distance, 0];
		}
		let distsquare = a * a + b * b;
		let t0 = - ( (p1.x - p.x) * (-b) + (p1.y - p.y) * a ) / distsquare;
		if (t0 >= 0 &&  t0 <= 1) 
			distance = Math.abs(a * p.x + b * p.y + c) / Math.sqrt(distsquare);

		let distance_p1 = Geometry2d.pointsEuklidDistance(p, p1);
		if (distance_p1 < distance)
		{
			return [new Point(p1), distance_p1, 1.0e-6]; // 0.000001];
		}
		
		let x = p1.x * (1 - t0) + p2.x * t0;
		let y = p1.y * (1 - t0) + p2.y * t0;

		return [new Point(x, y), distance, t0];
	}

	static closestPointOnPolygonBorderToPoint(p, poly)
	{
		let index = 0;
		let minDistance = Number.POSITIVE_INFINITY;
		let pcmin = null;
		let lambda = 0.5;
		
		for (let i = 0; i < poly.length; i++)
		{
			let p1 = poly[i], p2 = poly[(i + 1) % poly.length];
			let [pc, distance, t0] = Geometry2d.closestPointOnLineTo(p, p1, p2);

			if (distance < minDistance)
			{
				index = i;
				pcmin = new Point(pc);
				lambda = t0;
				minDistance = distance;
			}
		}
		return [pcmin, lambda, index];
	}
	
	static polygonPointCloseToPoint(polygon, point, maxdist)
	{
		let n = polygon.length;
		for (let i = 0; i < n; i++)
		{
			if (Math.abs(polygon[i].x - point.x) < maxdist && 
				Math.abs(polygon[i].y - point.y) < maxdist)
				return i;
		}
		return -1;
	}
	
	static pointCloseToPoint(p1, p2, maxdist)
	{
		if (p1 == null || p2 == null) return false;
		if (Math.abs(p1.x - p2.x) < maxdist && Math.abs(p1.y - p2.y) < maxdist)
			return true;
		return false;
	}	

// Simple Minkowski-Sum Test of two convex polygons
// 	    let res1 = Geometry2d.minkowskiSum([new Point(-4,2), new Point(-3,1), new Point(-2,2)],
// 									   [new Point(2,3), new Point(2,1), new Point(4,1), new Point(4,3)]);

	// Minkowski Sum of two convex polygons .....................
	// see: https://cp-algorithms.com/geometry/minkowski.html#implementation
	static minkowskiSum(polyP, polyQ)
	{
		let res = [];
		let oPolyP = this.reOrder(polyP);
		let oPolyQ = this.reOrder(polyQ);

		for (let i = 0, j = 0; (i <= polyP.length || j <= polyQ.length) && (i + j < polyP.length + polyQ.length); )
		{
			let p1 = oPolyP[i % polyP.length];
			let p2 = oPolyP[(i+1) % polyP.length];
			let q1 = oPolyQ[j % polyQ.length];
			let q2 = oPolyQ[(j+1) % polyQ.length];
			res.push(this.msum(p1, q1));
			let pdelta = new Point(p2.x - p1.x, p2.y - p1.y);
			let qdelta = new Point(q2.x - q1.x, q2.y - q1.y);
			let cross = this.crossProduct(pdelta, qdelta);

			if (cross <= 0) j++;
			if (cross >= 0) i++;

		}
		return res;
	}

	static msum = (p, q) => new Point(p.x + q.x, p.y + q.y);
	static rotateArray = (arr, k) => arr.slice(k).concat(arr.slice(0, k));
	static crossProduct = (p1, p2) => p1.x * p2.y - p1.y * p2.x;

	static reOrder(poly)
	{
		let pos = 0;
		for(let i = 1; i < poly.length; i++)
		{
			if(poly[i].y < poly[pos].y || (poly[i].y == poly[pos].y && poly[i].x < poly[pos].x))
				pos = i;
		}
		return this.rotateArray(poly, pos);
	}
}

