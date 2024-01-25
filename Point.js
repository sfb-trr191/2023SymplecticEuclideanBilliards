/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
export class Point 
{
	constructor(x = 0, y = 0)
	{
	    if (x == null || y == null) 
		{
			this.x = 0;
			this.y = 0;
		}
		else
		if (typeof x === 'number' && typeof y === 'number') 
		{
			this.x = x;
			this.y = y;
		}
		else if (x instanceof Point)
		{
			this.x = x.x;
			this.y = x.y;
		}
		else if (x instanceof Array)
		{
			this.x = x[0];
			this.y = x[1];
		}	
		else
			throw("Invalid Parameter of Point");
	}
}
