/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */

export class NewtonCotes
{ 
	a = 0.0;
	b = 1.0;
	n;
	x = [];
	w = [];
	factor = 1.0;
	h;

	constructor(a1, b1, n1)
	{
		this.a = a1;
		this.b = b1;
		this.n = n1;
		// Stützstellen und Gewichte bestimmen;
		this.h = (b1 - a1) / n1;
		for (let i = 0; i <= n1; i++)
			this.x[i] = a1 + i * this.h;

		switch (n1)
		{
			case 1: this.w = [0.5, 0.5]; this.factor = 1.0 / 2.0; break;
			case 2: this.w = [1.0, 4.0, 1.0]; this.factor = 1.0 / 3.0; break;
			case 3: this.w = [1.0, 3.0, 3.0, 1.0]; this.factor = 3.0 / 8.0; break;
			case 4: this.w = [7.0, 32.0, 12.0, 32.0, 7.0]; this.factor = 2.0 / 45.0; break;
			default: 
			 this.n = 3; this.w = [1.0, 3.0, 3.0, 1.0]; this.factor = 3.0 / 8.0; break;
		}
	}

	static SimpsonFormula(a, b, func)
	{
		let val = func(a) + 4.0 * func((b + a) / 2.0) + func(b);
		return (b - a) / 6.0 * val;
	}

	static PulcherimaFormula(a, b, func) // 3/8 rule
	{
		let val = func(a) + 3.0 * func(a + (b - a) / 3.0) + 3.0 * func(a + 2.0 * (b - a) / 3.0) + func(b);
		return (b - a) / 8.0 * val;
	}

	generalNewtonCotes(func) // n = 1, 2, 3, 4, default is 3
	{
		let val = 0;
		for (let i = 0; i < this.w.length; i++)
			val += this.w[i] * func(this.x[i]);
			
		return this.h * this.factor * val;
	}
}