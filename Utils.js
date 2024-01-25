/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */

import { CompareIt } from './CompareIt.js';

export class CubicResult
{
	real = [];
	imag = [];
	nosolution = false;

	constructor() //
	{
		for (let i = 0; i < 3; i++)
		{
			this.real[i] = Number.POSITIVE_INFINITY;
			this.imag[i] = 0;
		}
	}
}

export class Utils
{
	// solve a*x*x*x + b * x* x + c * x + d = 0
	static cubicRoots(a, b, c, d)
	{
		let result = new CubicResult();
		if (CompareIt.aboutEquals(a, 0.0)) // quadratic equation b x * x + c * x + d = 0
		{
			if (CompareIt.aboutEquals(b, 0.0)) // liner equation  c * x + d = 0
			{
				if (CompareIt.aboutEquals(a, 0.0)) // no soution
				{
					result.nosolution = true;
					return result;
				}
				else
				{
					result.real[0] = -d / c;
					result.imag[0] = 0;
					return result;
				}
			}
			else
			{
				let t = c / (b + b);
				let discriminant = t * t - d / b;
				if (CompareIt.aboutEquals(d, 0.0))
				{
					result.real[0] = -t;
					result.imag[0] = 0;
					return result;
				}
				else if (discriminant > 0)
				{
					let tsqrt = Math.sqrt(discriminant);
					result.real[0] = -t + tsqrt;
					result.imag[0] = 0;
					result.real[1] = -t - tsqrt;
					result.imag[1] = 0;
					return result;
				}
				else // discriminant < 0
				{
					let tsqrt = Math.sqrt(-discriminant);
					result.real[0] = -t;
					result.imag[0] = tsqrt;
					result.real[1] = -t;
					result.imag[1] = -tsqrt;
					return result;
				}
			}
		}
		else // Cardano's formula solving the full cubic equation!
			 // see: https://de.wikipedia.org/wiki/Cardanische_Formeln
		{
			let B = b / a;
			let C = c / a;
			let D1 = d / a;

			let Q = (3 * C - B * B) / 9;
			let R = (9 * B * C - 27 * D1 - 2 * B * B * B) / 54;
			let D = Q * Q * Q + R * R;

			let S, T;
			if (D >= 0.0)
			{
				let rootD = Math.sqrt(D);
				S = Math.sign(R + rootD) * Math.pow(Math.abs(R + rootD), (1.0 / 3.0));
				T = Math.sign(R - rootD) * Math.pow(Math.abs(R - rootD), (1.0 / 3.0));

				result.real[0] = -B / 3 + (S + T);
				result.imag[0] = 0;
				result.real[1] = -B / 3 - (S + T) / 2;
				let im = Math.abs(Math.sqrt(3) * (S - T) / 2);
				result.imag[1] = im;
				result.real[2] = result.real[1];
				result.imag[2] = -im;
			 }
			else
			{
				let th = Math.acos(R / Math.sqrt(-Q * Q * Q));

				result.real[0] = 2 * Math.sqrt(-Q) * Math.cos(th / 3.0) - B / 3.0;
				result.real[1] = 2 * Math.sqrt(-Q) * Math.cos((th + 2 * Math.PI) / 3.0) - B / 3.0;
				result.real[2] = 2 * Math.sqrt(-Q) * Math.cos((th + 4 * Math.PI) / 3.0) - B / 3.0;

				result.imag[0] = result.imag[1] = result.imag[2] = 0;
			}
		}
        return result;  
    }
    
    static horner(coeff, t)
	{
        let res = coeff[coeff.length - 1];
		for (let i = coeff.length - 2; i >= 0; i--)
			res = res * t + coeff[i];
		return res;
	}
	
		 
	static deflatePolynom(coeff, t) // use horner to deflate the polynomial by (t - troot)
	{
	 	let n = coeff.length;
	 	let a = [];
	 	let r = 0;
	 	
		for (let i = 0; i < n; i++)
		{
			r = r * t + coeff[n-1-i];
			a[n-1-i] = r;
		}
		return a.slice(1); // forget the first one, index = 0
	}
    
    // Test:
    // let r =	Utils.polynomMultiplication([1,2,1], [1,-2,1]); // = [1,0,-2,0,1]
	// let r =	Utils.polynomMultiplication([2,-1,-2,1], [-3,2,1]); // = [-6,7,6,-8,0,1]
	static polynomMultiplication(a, b)
	{
		// kann man beschleunigen mit fast FFT - lohnt aber nur für große n, m
		let n = a.length;
		let m = b.length;
		
		let c = new Array(n + m - 1).fill(0);
		for (let i = 0; i < n; i++)
			for (let j = 0; j < m; j++)
				c[i+j] += a[i] * b[j];
		return c;
	}

}