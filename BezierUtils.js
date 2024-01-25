/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from './Point.js';
import { Utils, CubicResult } from './Utils.js';
import { IntersectionPoint } from './IntersectionPoint.js'; 
import { CompareIt } from './CompareIt.js';

import { Complex } from './complexbase.js';
import { Polynomial } from './polynomialbase.js';

import { NewtonCotes } from './NewtonCotes.js';

export class BezierUtils
{
	// A lot of information is in Wiki: https://de.wikipedia.org/wiki/B%C3%A9zierkurve
	// An excellent summary and a lot of information you find in: https://pomax.github.io/bezierinfo/
	
	// contructs a cubic Bezier curve of a polygon 
	// condition here is: the first and second derivate at the start and end points is equal
	// so that a smooth cure will be contructed from the polygon
	//
	// For a detailed description of the algorithm see the link above
	// the return value is a set of Bezier segment holding the start and end points of the polyon as well
	// as the two control points for the segment
	
	// see: https://www.codeproject.com/Articles/769055/Interpolate-D-polygon-usign-Bezier-curves-in-WPF

	static bezierCurveFromPolygon(polygon, order = 3, scale = 0.75, isClosedCurve = true)
	{
		// scale is a heuristic value, must between 0.0 and 1.0

		// See: https://stackoverflow.com/questions/15691499/how-do-i-draw-a-closed-curve-over-a-set-of-points
		// and: https://www.math.ucla.edu/~baker/149.1.02w/handouts/dd_splines.pdf
		if (polygon.length < 3)
			return null;
			
		order = Math.max(3, Math.min(20, order)); // min order 3, max order 20	
		var result = [];
		const len = polygon.length;
		for (let i = 0; i < len; i++) // create control points for cubic bezier curve first
		{	
			let prev = (i == 0 && isClosedCurve) ? polygon.length - 1 : Math.max(0, i - 1);
			let next = (i + 1) % polygon.length;
			let nextnext = (i + 2) % polygon.length;

			let x1 = polygon[i].x; // this point
			let y1 = polygon[i].y;

			let	x0 = polygon[prev].x; //Previous point
			let	y0 = polygon[prev].y;
			
			let x2 = polygon[next].x; //Next point
			let y2 = polygon[next].y;

			let	x3 = polygon[nextnext].x;  // next after next
			let	y3 = polygon[nextnext].y;

			let len1 = Math.hypot((x1 - x0), (y1 - y0));
			let len2 = Math.hypot((x2 - x1), (y2 - y1));
			let len3 = Math.hypot((x3 - x2), (y3 - y2));

			let k1 = len1 / (len1 + len2);
			let k2 = len2 / (len2 + len3);

			let xc1 = (x0 + x1) / 2.0;  // middle points of edges
			let yc1 = (y0 + y1) / 2.0;
			
			let xc2 = (x1 + x2) / 2.0;
			let yc2 = (y1 + y2) / 2.0;
			
			let xc3 = (x2 + x3) / 2.0;
			let yc3 = (y2 + y3) / 2.0;

			let xm1 = xc1 + (xc2 - xc1) * k1;
			let ym1 = yc1 + (yc2 - yc1) * k1;

			let xm2 = xc2 + (xc3 - xc2) * k2;
			let ym2 = yc2 + (yc3 - yc2) * k2;

			// Resulting control points. Here scale = smooth_value is mentioned
			// above coefficient scale whose value should be in range [0...1]
			let ctrl1_x = (xc2 - xm1) * scale + x1;
			let ctrl1_y = (yc2 - ym1) * scale + y1;

			let ctrl2_x = (xc2 - xm2) * scale + x2;
			let ctrl2_y = (yc2 - ym2) * scale + y2;

			let p0 = new Point(x1, y1);
			let p1 = ((i == 0) && !isClosedCurve) ? new Point(x1, y1) : new Point(ctrl1_x, ctrl1_y);
			let p2 = ((i == polygon.length - 1) && !isClosedCurve) ? new Point(x2, y2) : new Point(ctrl2_x, ctrl2_y);
			let p3 = new Point(x2, y2);

			result.push([p0, p1, p2, p3]);
		}
		if (order == 3) return result;

		// (order > 3) // create the control points for the higher order
		// see: https://de.wikipedia.org/wiki/B%C3%A9zierkurve#Graderh%C3%B6hung_einer_B%C3%A9zierkurve
		
		// In the end there is no gain at all:
		// The Bezier curve is the same as the cubic one, the calculations later are more expensive
		// We do not know any obvious method for higher order Bezier curves like that for cubic ones
		
		// All later function work fine for Bezier curves of any order, there is no restriction at all !!!

		for (let i = 0; i < len; i++)
		{
			let a = new Array(order + 1).fill(null);
			for (let k = 3; k < order; k++)
			{
				a[0] = new Point(result[i][0]);
				a[k+1] = new Point(result[i][k]);
				for(let j = 1; j <= k; j++)
				{
					a[j] = new Point(result[i][j-1].x * j / (k + 1) + result[i][j].x * (1.0 - j / (k+1)),
									 result[i][j-1].y * j / (k + 1) + result[i][j].y * (1.0 - j / (k+1)) );
				}
				result[i] = a.slice();
			}
		}
		return result;
	}
	

	// calculation of all intersection points of a Bezier segment bseg with a straight
	// line given by two points p0, p1
	static calcIntersections(p0, p1, bseg, segno)
	{
		// returns a list of 2d-points with imag = 0 which intersects with a Bezier segment b
		// the resulting set can be empty or can contain up to bseg.length-1 'valid' points

		// take the equation: A * x + B * y + C = 0
		// then A = p1.y - p0.y, B = p0.x - p1.x and
		//      C = p0.x * (p0.y - p1.y) + p0.y * (p1.x - p0.x)

		let A = p1.y - p0.y;
		let B = p0.x - p1.x;
		let C = p0.x * (p0.y - p1.y) + p0.y * (p1.x - p0.x);

		// convert the Bernstein basis to the monom basis
		var pm = BezierUtils.bezierMonomialParam(bseg);
		let c = pm.map(p => A * p.x + B * p.y);  // coeff of t^i
		if (c.length > 0) c[0] += C;

		let realroots = BezierUtils.findAllPolynomialRealRoots(c);
		return realroots.filter(r => (r >= 0.0 && r <= 1.0))
				.map(r => new IntersectionPoint(this.calcBezierWithMonomBasis(r, pm), segno, 0.0, r));
	}

	static calcBezier(t, bseg)
	{
		// this is the generic algorithm from de Casteljau 
		// recursive constructing Bezier curves
		// It is valid for any degree of the Bezier curves and it is numerical stable!
	
		const lerp = (t, p1, p2) => (1 - t) * p1 + t * p2; // linear interpolaton, named after Emil Lerp
		const reduce = (t, p1, p2, ...ps) => (ps.length > 0) ? [lerp(t, p1, p2), ...reduce(t, p2, ...ps)] : [lerp(t, p1, p2)];
		const deCasteljau = (t, ps) => (ps.length > 1) ? deCasteljau(t, reduce(t, ...ps)) : ps[0]; 

		let x = deCasteljau(t, bseg.map(e => e.x));
		let y = deCasteljau(t, bseg.map(e => e.y));
		return new Point(x, y);
	}
	
	static calcBezierDerivate(t, bseg) 
	{
		// The first derivate of a Bezier curve is again a Bezier curve with the differences of the original 
		// control points as the new control points multiplied by n. 
		// So the dimension of the derivate is n-1.
		
		let diff = [];
		let x, y;
		let n = bseg.length - 1;
		for (let i = 0; i < n; i++)
		{
			x = n * (bseg[i+1].x - bseg[i].x);
			y = n * (bseg[i+1].y - bseg[i].y);
			diff[i] = new Point(x, y);
		}
		return BezierUtils.calcBezier(t, diff);
	}
	
	static bernsteinToMonomial(i, n)
	{
		// Transformation of the Bernstein basis to the monom basis
		
		// This is the inefficient solution	but it shows what happens		
		// 		let d = new Array(i + 1).fill(0);			
		// 		for (let k = 0; k <= i; k++) 
		// 		{
		// 			d[k] = (-1) ** (i - k) * BezierUtils.binom(n, i) *  BezierUtils.binom(i, k);			
		// 		}
		// 		return d;
		
		function binom(n, k)
		{
			if (k < 0 || k > n) return 0;
			if (k === 0 || k === n) return 1;

			let res = 1;
			for (let i = 1; i <= k; i++) 
				res *= (n - k + i) / i;
			return res;
		}
		
		let d = new Array(i + 1).fill(0);

		d[0] = binom(n, i) * ((i % 2 == 0) ? 1.0 : -1.0);	
		for (let k = 0; k < i; k++) 
			d[k+1] = -d[k] * (i - k) / (k + 1.0)
		return d;
	}
	
	static bezierMonomialParam(bseg)
	{
		// with n = bseg.length - 1:
		// on result you can calc: bez(t) = a[n]*t^n + a[n-1]*t^(n-1) + ... + a[2]*t^2 + a[1]*t + a[0]
		// From Bernstein to Monom Basis: 
		
		// t^i = sum(j = 0 to i) [ (-1)**(i-j) * (n over i) / (i over j) * Bj,n(t)
		let a =[];
		let n = bseg.length - 1;
		for (let i = 0; i <= n; i++)
		{
			let res = BezierUtils.bernsteinToMonomial(i, n);
			let x = 0, y = 0;

			for (let j = 0; j <= i; j++)
			{
				x += res[j] * bseg[j].x;
				y += res[j] * bseg[j].y;
			}
			a[i] = new Point(x, y);
		}
		return a;
	}
	
	static bezierDeriavateMonomialParam(bseg)
	{
		let a = [];
		let n = bseg.length - 1;
		let diffx = 0, diffy = 0;

		for (let i = 0; i < n; i++)
		{
			diffx = n * (bseg[i+1].x - bseg[i].x);
			diffy = n * (bseg[i+1].y - bseg[i].y);
			a[i] = new Point(diffx, diffy);
		}
		return this.bezierMonomialParam(a);
	}
	
	// value of the Bezier polynomial with monom basis
	static calcBezierWithMonomBasis(t, pm)
	{
		// e.g. Horner schema for pm[3} * t^3 + pm[2] * t^2 + pm[1] * t + pm[0]
		// works for any Bezier degree in R^2
		let x = Utils.horner(pm.map(e => e.x), t);
		let y = Utils.horner(pm.map(e => e.y), t);
		return new Point(x, y);
	}

	static isLineSegmentInsideBezierCurve(p1, p2, bsegs)
	{
		let lineSegPoint = (v1, v2, t) => (1 - t) * v1 + t * v2;
		
		let t0 = 0.01;
		let t1 = 1.0 - t0;

		let point1 = new Point(lineSegPoint(p1.x, p2.x, t0), lineSegPoint(p1.y, p2.y, t0));		
		let point2 = new Point(lineSegPoint(p1.x, p2.x, t1), lineSegPoint(p1.y, p2.y, t1));

		if (BezierUtils.isPointInsideBezierCurve(point1, bsegs) &&
			BezierUtils.isPointInsideBezierCurve(point2, bsegs))
			return true;
		else
			return false;
	}

	static isPointInsideBezierCurve(p1, bsegs)
	{
		// Jordan algorithm for closed curves, here closed Bezier curves)
		//  does the same as the Winding algorithm
		let rootList = []; 
		let p2 = new Point(p1.x + 1, p1.y);  // generate a line parallel to the x-axis
		let len = bsegs.length;
		for (let i = 0; i < len; i++)
		{
			let ipoints = BezierUtils.calcIntersections(p1, p2, bsegs[i], i);
			if (ipoints.length > 0)
				rootList.push(...ipoints);
		}
		let count = 0;
		len = rootList.length;
		for (let i = 0; i < len; i++)
		{
			if (rootList[i].Point.x > p1.x) // only points to the right!
				count++;
		}
		return (count % 2 != 0); // odd means: the point is inside the closed curve
	}

	static calcDistanceCoeff(p, bseg)
	{
		// find minimum of d(t) = || bseg(t) - p ||^2
		// that is:
		// d(t) = (a[n].x * t^n + a[n-1].x * t^(n-1) + ... a[1].x * t + a[0].x - px) ^2 + 
		//        (a[n].y * t^n + a[n-1].y * t^(n-1) + ... a[1].y * t + a[0].y - py) ^2
		// which is equivalent to finding the roots of first derivate (and the second derivate is >= 0 at the root points)
		// d'(t) = 0;
		// let pn(t).x = a[n].x * t^n + a[n-1].x * t^(n-1) + ... a[1].x * t + a[0].x and analog pn(t).y
		//
		// So we have to solve:
		// (pn(t).x - px) * pn'(t).x + (pn(t).y - py) * pn'(t).y = 0	
			
		// returns the coefficients of the monomial basis;
		
		if (p == null)
			return [null, 0.5, 0];
						
		let i = 0;
		let mp = BezierUtils.bezierMonomialParam(bseg);
		let mpdev = BezierUtils.bezierDeriavateMonomialParam(bseg);

		let mpx = mp.map(e => e.x);
		let mpy = mp.map(e => e.y);
		
		mpx[0] -= p.x;
		mpy[0] -= p.y;
		
		let mpdevx = mpdev.map(e => e.x);
		let mpdevy = mpdev.map(e => e.y);
		
		let prodx = Utils.polynomMultiplication(mpx, mpdevx);
		let prody = Utils.polynomMultiplication(mpy, mpdevy);

		let coeff = [];
		for (i = 0; i < prodx.length; i++)
			coeff[i] = prodx[i] + prody[i];

		return coeff;	
	}
	
	static closestPointOnBezierCurveToPoint(p, bsegs)
	{
		if (p == null || bsegs == null || bsegs.length < 3)
			return [null, 0.5, 0];
			
		function distanceValueSquared(p, t, bseg)
		{
			let bpoint = BezierUtils.calcBezier(t, bseg);
			return (bpoint.x - p.x) * (bpoint.x - p.x) + (bpoint.y - p.y) * (bpoint.y - p.y);
	    }
	    
		let minDistance = Number.POSITIVE_INFINITY;
		let minIndex = -1;

		let roots = [];
		let k = 0;
		var len = bsegs.length;
		for (let j = 0; j < len; j++)
		{
			let res = BezierUtils.findMinimumDistance(p, bsegs[j])
			for (let k = 0; k < res.length; k++)
				roots.push([res[k], j]);
				
			roots.push([0.0, j]); // add the corner points of the Bezier curve to ensure you find a solution
		}

		// look for t value on the bezier curve with minimal distance to p
		len = roots.length;
		for (let i = 0; i < len; i++)
		{
			let t = roots[i][0];
			if (t >= 0 && t < 1.0) // only solutions with 0.0 <= t < 1.0 are on the Bezier segment 
			{
				let val = distanceValueSquared(p, t, bsegs[roots[i][1]]);
				if (val < minDistance)
				{
					minDistance = val;
					minIndex = i;
				}
			}
		}

		if (roots == null || roots == [] || minIndex < 0)
			return [null, 0.5, 0];
			
		let t0 = roots[minIndex][0];
		let index = roots[minIndex][1];
		return [BezierUtils.calcBezier(t0, bsegs[index]), t0, index];
	}
	
	static lengthBezierCurve(bsegs) // use Simpson without any subintervals
	{
		if (bsegs == null) return 0;
		let val = 0;
		var len = bsegs.length;
		for (let j = 0; j < len; j++)
			val += BezierUtils.lengthBezierSegment(bsegs[j]);
			
		return val;
	}
	
	static lengthBezierSegment(bseg) 					
	{
		if (bseg == null) return 0;
		
		function func(t)
		{
			let dev = BezierUtils.calcBezierDerivate(t, bseg);
			return Math.hypot(dev.x, dev.y);
		}
		return NewtonCotes.SimpsonFormula(0.0, 1.0, func);  		
	}				

	// This is the general algorithm .................................................
	static lengthBezierCurve_gen(bsegs, intervals, level)
	{
		level = Math.min(4, Math.max(1, level));
		intervals = Math.min(10, Math.max(1, intervals));
		let val = 0;
		let nc = {};
		 // seems to be good enough without interval partitioning
		for (let k = 0; k < intervals; k++)
		{
			nc = new NewtonCotes(k / intervals, (k+1) / intervals, level);
			for (let j = 0; j < bsegs.length; j++)
				val += BezierUtils.lengthBezierSegment_gen(nc, bsegs[j]);
		}
		return val;
	}
	
	static lengthBezierSegment_gen(nc, bseg) 					
	{
	   return nc.generalNewtonCotes( 
									function func(t)
									{
										let point = BezierUtils.calcBezierDerivate(t, bseg);
										return Math.hypot(point.x, point.y);
									}
						);						
	}
	// ................................................................................

	static findMinimumDistance(p, bseg)
	{
		// coeff contains the coefficients of the polynomial to find the zeros (roots) for.
		let coeff = BezierUtils.calcDistanceCoeff(p, bseg);
		return BezierUtils.findAllPolynomialRealRoots(coeff);
	}
	
	static findAllPolynomialRealRoots(coeff)
	{
		let realroots = [];
		if (coeff.length == 4) // cubic bezier curve
		{
			let result = Utils.cubicRoots(coeff[3], coeff[2], coeff[1], coeff[0]);
			
			const len = result.real.length;
			for (let i = 0; i < len; i++)
				if (CompareIt.aboutEquals(result.imag[i], 0.0))
					realroots.push(result.real[i]);
		}
		else
		{
			// You can use the numeric library functions of Henrik Vestermark 
			// see: http://www.hvks.com/Numerical/Downloads/HVE%20Practical%20Implementation%20of%20Polynomial%20root%20finders.pdf
			// see as an alternative http://www.hvks.com/Numerical/js.html By Henrik Vestermark (hve@hvks.com) 
			// An excellent paper about a lot of polynomial root finder is: 
			// http://www.hvks.com/Numerical/Downloads/HVE%20Practical%20Implementation%20of%20Polynomial%20root%20finders.pdf
			
			let coeffrev = [...coeff].reverse();  // coeff vector has to be reversed for using this library
			let roots = new Polynomial(coeffrev).zeros("Ostrowski", false, false); // "Newton", "Ostrowski", "Halley", "Householder", 

			realroots = roots.slice(1).filter(r => CompareIt.aboutEquals(r.y, 0.0)).map(r => r.x);
		}
		return realroots;
	}
}
