/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from "./Point.js";

export class FileIO
{
	
	delimiter = ' ';
	lineEnd = '\n';
	
	constructor(delim = ' ')
	{
		this.delimiter = delim;
	}
	
	
	async readWithPicker()  // returns [file.name, file.type, text]
	{
		const pickerOpts = 
		{
		  types: 
		  [
			{
			  description: "csv Files",
			  accept: {
				"text/csv": [".csv"],
			  },
			},
			{
			  description: "json Files",
			  accept: {
				"application/json": [".json"],
			  },
			},
		  ],
		  excludeAcceptAllOption: true,
		  multiple: false,
		};
		
		let handle = null;
		try
		{
			// showOpenFilePicker returns an array of handles
			[handle] = await showOpenFilePicker(pickerOpts); // show the file picker, only interactive (security reasons)
			let file = await handle.getFile(); // get the file
			if (file == null)  [null, null, "Error"];
		
			let text = await file.text(); // get the data
			// there is no close on readable objects in javascript!
			return [file.name, file.type, text];
		}
		catch(err)
		{
			return [null, null, "Error"];
		}
	}
	
	async writePointsWithPicker(name, points, csvdelim = ' ')
	{
		const pickerOpts = 
		{
		  types: 
		  [
			{
			  description: "csv Files",
			  accept: {
				"text/csv": [".csv"],
			  },
			},
			{
			  description: "json Files",
			  accept: {
				"application/json": [".json"],
			  },
			},
		  ],
		  suggestedName: '',
		  excludeAcceptAllOption: true,
		};
		
		if (name != null && name.length > 0)
			pickerOpts.suggestedName = name;
			
		let handle = null;
		try
		{
			handle = await showSaveFilePicker(pickerOpts); // show the file picker, only interactive (security reasons)
			// use default csv, test if name ends with .json
			const writable = await handle.createWritable();
			if (handle.name.endsWith('.json'))
				writable.write(JSON.stringify(points)); // json format
			else 
				points.forEach(p => writable.write(p.x + csvdelim + p.y + this.lineEnd)); // csv format
			await writable.close();
		}
		catch(err)
		{
			return [null, null, "Error"];
		}
	}
	
	writeFilePointArray(name, points, delim = ' ')
	{
		var fs = require('fs');

		var file = fs.createWriteStream(name);
		file.on('error', err => alert(err));
		points.forEach(p => file.write(p.x + delim + p.y + this.lineEnd));
		file.end();
	}
	
	readFileText(name)
	{
		const fs = require('fs');

		fs.readFile(name, 'utf8', (err, text) => 
		{
			if (err) 
			{
				alert(err);
				return null;
			}
			return text;
		});
	}
	
	async writeFileText(name, text)
	{
		const fs = require('fs');
		try
		{
			await fs.writeFile(name, text); // overwrite
		}
		catch (error) 
		{
			alert(error);
		}
	}
}