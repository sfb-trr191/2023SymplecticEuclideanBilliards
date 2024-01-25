/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import {BilliardsBall} from './BilliardsBall.js'

export class BilliardsBalls extends Array // comment
{

	contructor()
	{
	}

	clear()
	{
		for (let i = 0; i < this.length; i++)
			this[i].clear();
		base.clear();
	}

	setTrajectoriesMaxDepth(depth)
	{
		for(let i = 0; i < this.length; i++)
			this[i].setTrajectoriesMaxDepth(depth);
	}
}

