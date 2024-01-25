/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { BezierUtils } from './BezierUtils.js'
import { Point } from './Point.js';
import { CircleArc } from './CircleArc.js'

export class Drawings 
{
	canvas;
	ctx;
	
	constructor (canvas) 
	{ 	
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
	}
	
	clear(fillstyle = "cornsilk")
	{
		// this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fillStyle = fillstyle;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	// draw the ball
	drawBall(point, color = "#0095DD", radius = 5) 
	{
		this.ctx.beginPath();
		this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
		this.ctx.fillStyle = color;
		this.ctx.fill();
		this.ctx.closePath();
	}
	
	// draw the ball line
	drawBallLine(from, to, color, linewidth = 1, circleArc = null, sagittaFactor = 0.0)
	{
		if (from == null || to == null) return;
		if (to.x > 0 && to.y > 0 && from.x > 0 && from.y > 0)
		{
			this.ctx.save();
			this.ctx.lineWidth = linewidth;
			
			this.ctx.strokeStyle = color; 
			this.ctx.beginPath();
			
			if (circleArc == null || sagittaFactor == 0.0)
			{
				this.ctx.moveTo(from.x, from.y);
				this.ctx.lineTo(to.x, to.y);
			}
			else
			{
				this.drawCircleArc(circleArc, from, to);
			}

			this.ctx.stroke();
			this.ctx.restore();
		}					
	}

	// draw the polygon
	drawPolygon(polygon, color = '#000000', linewidth = 2)
	{
		if (polygon.length < 3) return;
		
		this.ctx.save();

		let linestyle = this.ctx.strokeStyle; 
		let linewidthsave = this.ctx.linewidth;

		this.ctx.lineWidth = linewidth;
		this.ctx.strokeStyle = color;
		
		this.ctx.beginPath();
		this.ctx.moveTo(polygon[0].x, polygon[0].y);
		for (let i = 1; i < polygon.length; i++) 
			this.ctx.lineTo(polygon[i].x, polygon[i].y);
		this.ctx.closePath();
		
		this.ctx.stroke();
		this.ctx.restore();
	}
	
	// draw the line history
	drawTrajectories(ballhistory, count, color = '#000000', dashStyle = [1, 4], linewidth = 1, sagittaFactor = 0.0) // 1 dot followed by 4 spaces
	{
		if (ballhistory != null && ballhistory.length < 2) return;
		this.ctx.save();
		
		this.ctx.lineWidth = linewidth;
		this.ctx.beginPath();

		let linestyle = this.ctx.strokeStyle; 
		this.ctx.strokeStyle = color;

		let start = ballhistory.length - 1;
		this.ctx.moveTo(ballhistory[start].x, ballhistory[start].y);
		
		if (count <= 0) return;
		
		if (count != ballhistory.length) // draw a solid line
			this.ctx.setLineDash([]);
		else
			this.ctx.setLineDash(dashStyle);
			
		if (sagittaFactor == 0.0)
		{
			for (let i = start; i >= 0; i--)
			{
				if (ballhistory[i] != null)
					this.ctx.lineTo(ballhistory[i].x, ballhistory[i].y);
			}
		}
		else
		{	
			let p1 = new Point();
			let p2 = ballhistory[start];

			for (let i = start; i > start - count; i--)
			{	
				if (ballhistory[i] != null && ballhistory[i-1] != null)
				{
					p1 = p2;
					p2 = ballhistory[i-1];

					let h = Math.hypot(p2.x - p1.x, p2.y - p1.y) * sagittaFactor; // this is the assumption!
					let circleArc = new CircleArc().From2PointsAndSagittaHeight(p1, p2, h);
					this.drawCircleArc(circleArc, p1, p2);
				}
			}
		}
		this.ctx.stroke();
		this.ctx.restore();
	}
	
	drawCircleArc(circleArc, p1, p2)
	{
		if (circleArc == null) return;
		let fromangle = circleArc.calcAngle(p1);
		let toangle = circleArc.calcAngle(p2);

		let direction = toangle < fromangle;
		// take always the shortest way between the 2 points
		if (Math.abs(toangle - fromangle) > Math.PI) direction = !direction;
		
		this.ctx.arc(circleArc.center.x, circleArc.center.y, circleArc.radius, fromangle, toangle, direction);		
	}

	isCubic = (seg) => seg.length == 4;

	// draw the bezier curve
	drawBezier(bezierSegments, pointradius = 5, color = '#ff0000', colorDegreeGreater3 = '#00FF00',
			   colorControlPoint = '#999500',
			   dashStyle = [2, 3], linewidth = 2, 
			   drawcontrolpoints = false) // 2 dots followed by 3 spaces
	{
		if (bezierSegments == null || bezierSegments.length < 3) return;
		
		this.ctx.save();
		let linestyle = this.ctx.strokeStyle; // save other attributes
		this.ctx.lineWidth = linewidth;

		if (this.isCubic(bezierSegments[0])) // cubic bezier curve, use ctx api
		{
			this.ctx.beginPath();
			this.ctx.strokeStyle = color; // line with red color
			
			this.ctx.moveTo(bezierSegments[0][0].x, bezierSegments[0][0].y);
			for (let i = 0; i < bezierSegments.length; i++)
			{
				// draw the curve by 2d-ctx API
				this.ctx.bezierCurveTo(bezierSegments[i][1].x, bezierSegments[i][1].y, 
									   bezierSegments[i][2].x, bezierSegments[i][2].y, 
									   bezierSegments[i][3].x, bezierSegments[i][3].y);
			}
			this.ctx.closePath();
			this.ctx.stroke();
		}
		else // do it native for any degree greater than 3
		{
			this.ctx.beginPath();
			this.ctx.strokeStyle = colorDegreeGreater3;
			const len = bezierSegments.length;
			for (let i = 0; i < len; i++)
			{
				let delta = 1.0 / this.canvas.width;				   
				for (let t = 0.0; t <= 1.0; t += delta)
				{
					let p = BezierUtils.calcBezier(t, bezierSegments[i]);
					this.ctx.lineTo(p.x, p.y); 
				}
			}
			this.ctx.closePath();
			this.ctx.stroke();
		}

		if (drawcontrolpoints) // draw control points
		{
			const len = bezierSegments.length;
			const bezlen = bezierSegments[0].length;
			for (let i = 0; i < len; i++)
			{
				for (let j = 0; j < bezlen - 1; j++)
				{
					let x = bezierSegments[i][j].x;
					let y = bezierSegments[i][j].y;
					
					this.ctx.beginPath();
					this.ctx.moveTo(x, y);
					this.ctx.arc(x, y, pointradius, 0, Math.PI * 2);
					if ( j > 0)
						this.ctx.fillStyle = colorControlPoint;
					else
						this.ctx.fillStyle = color;
					this.ctx.closePath();
					this.ctx.fill();
				}
			}
			
		}
		this.ctx.restore();
	}

	drawBezierOpt(bezierSegments, pointradius = 5, boptions, drawcontrolpoints = false)
	{
		this.drawBezier(bezierSegments, pointradius, 
										boptions.color,
										boptions.colorDegreeGreater3,
										boptions.colorControlPoint,
										boptions.lineDash,
										boptions.lineWidth,
										drawcontrolpoints);
	}
	
	// draw millimeter paper as background
	drawDesignBackground(options)
	{
		this.drawGridLines(options.minorLines);
		this.drawGridLines(options.majorLines);
	}
	
	drawGridLines(lineOptions) 
	{
		let iWidth = this.canvas.width;
		let iHeight = this.canvas.height;

		this.ctx.strokeStyle = lineOptions.color;
		this.ctx.strokeWidth = 1;

		this.ctx.beginPath();

		let x = 0;
		let y = 0;
		
		let count = Math.floor(iWidth / lineOptions.separation);
		for (let i = 0; i <= count; i++) 
		{
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, iHeight);
			x += lineOptions.separation;
		}

		count = Math.floor(iHeight / lineOptions.separation);
		for (let i = 0; i <= count; i++)
		{	
			this.ctx.moveTo(0, y);
			this.ctx.lineTo(iWidth, y);
			y += lineOptions.separation;
		}
		this.ctx.stroke();
	}
		
}