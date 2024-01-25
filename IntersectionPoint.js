/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import {Point} from './Point.js';

export class IntersectionPoint  // Schnittpunkt zweier Kurven
{
	Point = null;
	Index = 0;
	Distance = -1;
	t0 = 0;

	constructor(p, ind, dist = 0.0, t = 1.0)
	{
		this.Point = p;
		this.Index = ind;
		this.Distance = dist;
		this.t0 = t;
	}
}