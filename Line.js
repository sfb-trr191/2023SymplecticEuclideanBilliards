/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from './Point.js';

export class Line
{
	p1;
	p2;
	constructor (arg1 = null, arg2 = null)
	{
		if (arg1 instanceof Line) // complete copy
		{
			// return new Line(new Point(arg1.p1), new Point(arg1.p2));
			return new Line(arg1.p1, arg1.p2);
		}
		else
		{
			this.p1 = arg1;
			this.p2 = arg2;
		}
	}
}
