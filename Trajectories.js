/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import {Point} from './Point.js';
import { Geometry2d } from './Geometry2d.js';
    
export class Trajectories extends Array
{
	maxDepth = 0;    
	
	constructor (len)
	{
		super(); // must call super class !!!
		this.maxDepth = Math.max(len, 0);
	}
	
	getMaxDepth()
	{
		return this.maxDepth;
	}
	
	setMaxDepth(value)
	{
		value = Math.max(value, 0);
		if (value < this.maxDepth) 
			this.length = value; // delimit array
		this.maxDepth = value;
	}
	
	add(point)
	{
		// prevent adding the same point twice
		if (this.length > 0 && point.x === this[0].x && point.y === this[0].y)
			return;
			
		this.unshift(point); // insert at top: index = 0
		if (this.length > this.maxDepth) // remove the last one
			this.length = this.maxDepth; // this.splice(-1, 1);
	}

	get(i)
	{
		if (i >= this.maxDepth || i < 0 || i >= this.length)
			return null;
		return this[i];
	}

	getAll() 
	{ 
		return this;
	}  
}