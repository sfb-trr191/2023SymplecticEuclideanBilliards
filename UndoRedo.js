/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */

import { Point } from "./Point.js";

export class UndoRedo
{
	undoStack = [];
	redoStack = [];
	
	actionAdd = 0;
	actionChange = 1;
	
	iarray = [];
	 
	constructor(array)
	{
		if (array != null)
		{
			this.iarray.push(...array);
			for (let i = 0; i < array.length; i++)
				this.undoStack.push( {action: this.actionAdd, index: i, point: array[i]} );
		}
	}
	
	clear()
	{
		this.undoStack = [];
		this.redoStack = [];
		this.iarray = [];
	}
	
	unDo()
	{
		if (this.undoStack.length > 0)
		{
			let element = this.undoStack.pop();
			this.redoStack.push(element);

			if (element.action == this.actionAdd)
				this.iarray.pop();
 			else
 			{
 				let p = this.searchLastIndexPoint(element.index);
				if (p != null) this.iarray.splice(element.index, 1, p);
			}
		}
		return this.iarray;
	}
	
	searchLastIndexPoint(index)
	{
		let n = this.undoStack.length - 1;
		for (let i = n; i >= 0; i--)
			if (index == this.undoStack[i].index)
				return this.undoStack[i].point;
				
		return null;
	}
	
	reDo()
	{
		if (this.redoStack.length > 0)
		{
			let element = this.redoStack.pop();
			this.undoStack.push(element);

			if (element.action == this.actionAdd)
				this.iarray.push(element.point);
			else
				this.iarray[element.index] = element.point;
		}
		return this.iarray;
	}
	
	add(index, point)
	{
		this.redoStack = [];
		
		this.undoStack.push({action: this.actionAdd, index: index, point : point});
		this.iarray.push(point);
		return this.iarray;
	}
	
	move(index, point)
	{
		this.redoStack = [];
		
		this.undoStack.push( { action: this.actionChange, index: index, point : point } );
		this.iarray.splice(index, 1, point); 
		return this.iarray;
	}
	
}	