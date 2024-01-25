/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from './Point.js';

export class CurvePoint 
{
	P = null;
	t = 0.0;
	
	constructor(x = null, y = null, t = null) 
	{
		if (x == null && y == null && t == null)
		{
			this.P = new Point();
			this.t = 0.0;
		}
		else if (typeof x === 'number' && typeof y === 'number' && typeof t === 'number')
		{
			this.P = new Point(x, y);
			this.t = t;
		}
		else if (x instanceof Point && y == null && t == null)
		{
			this.P = new Point();
			this.t = 0.0;
		}
		else if (x instanceof Point && typeof y === 'number')
		{
			this.P = x;
			this.t = y;
		}
		else if (x instanceof CurvePoint)
		{
			this.P = new Point(x.P);
			this.t = x.t;
		}
	}
}
