/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from "./Point.js";
import { Drawings } from './Drawings.js';
import { Charts } from './Charts.js';

import { PolygonExample } from './PolygonExample.js';
import { BilliardsBall } from './BilliardsBall.js';
import { BilliardsBalls } from './BilliardsBalls.js';
import { Geometry2d } from './Geometry2d.js';
import { BezierUtils } from './BezierUtils.js';
import { DataConversion } from './DataConversion.js';
import { FileIO } from './FileIO.js';
import { UndoRedo } from './UndoRedo.js';
import { Configuration } from './Configuration.js';
import { CompareIt } from './CompareIt.js';

// the element functions accessing the html page
let elementGet = (name) => document.getElementById(name);
let elementEnable = (name, enable) => elementGet(name).disabled = !enable;
let elementShow = (name, show) => elementGet(name).style.display = show ? 'inline' : 'none';
let elementChecked = (name) => elementGet(name).checked;
let elementSetInnerText = (name, text) => elementGet(name).innerText = text;
let elementSetValue = (name, value) => elementGet(name).value = value;
let elementGetValue = (name) => elementGet(name).value;

// canvas
const billiardsArea = elementGet("billiardsarea");
const canvas = elementGet("billiardscanvas");

// ensure the whole canvas is quadratic!
canvas.width = Math.min(billiardsArea.clientWidth, billiardsArea.clientHeight);
canvas.height = canvas.width;

// Read configuration ////////////////////////////////////////////////
let config = new Configuration().getConfig();
////////////////////////////////////////////////

// initially hidden
elementShow("batchreflections", false);
elementShow("label_batchreflections", false);
elementShow("cleardesign", false);
elementShow("undo", false);
elementShow("redo", false);
elementShow("periodlength", false); 
elementEnable("periodlength", false);
elementShow("label_periodlength", false);


elementEnable("filename", false);

/****************************************************************/
// start: 	http://localhost:8000/

/******************* Animation timer ****************************/
 let interval_ID = null;
 /***************************************************************/

//// Runtime variables /////////////////////////////////////

let trajectoriesMaxDepth = Number(elementGetValue("trajectoriesmaxdepth"));
let speed = Number(elementGetValue("speed"));
let numVertices = Number(elementGetValue("vertices"));

var polygon = [];
var designMode = false;

let batchReflections = Number(elementGetValue("batchreflections"));

let startIndex = config.startIndex; // 0
let startLambda = config.startLambda; // 0.5;

let useBezierCurve = false;
let drawBezierControlPoints = false;
let bezierScale = Number(elementGetValue("bezierscalefactor")) / 100.0;

let angleRotate = 0;
let drawingPercentSize = Number(elementGetValue("drawingsize"));
let useSymplectic = elementChecked("usesymplectic");
let sagittaHeightFactor = 0.0; // use a cirle line in drawings if sagittaHeightFactor != 0

let batchMode = false;

let drawings = null;
let chart = null;
let bezierSegments = [];
let boundingBox = null;

let startPoint = null;

let billiardsBalls = [];
let inMemoryData = [];
let undoRedoStack = null;

let csvDelimiter = ' ';

let dragPoint = null;
let dragindex = -1;
let isStartPoint = false;

///////////////////////////////////////////////
let radians = (degree) => degree * Math.PI / 180; // degree to radians

function registerHandler(htmlName, eventString, handlerFunction)
{
	let id = (htmlName == null || htmlName == '') ? document : elementGet(htmlName); 
	if (id == null) return;
	id.addEventListener(eventString, handlerFunction);
}

// Register event handler ... 

// Mouse + key events
canvas.addEventListener('mousedown', mouseDown); // mousedown is always active on canvas
canvas.addEventListener('mousemove', mouseMove); // show mouse position
canvas.addEventListener('mouseup', mouseUp); // terminate dragging
canvas.addEventListener('mouseleave', mouseUp); // terminate dragging

registerHandler(null, "keyup", keyuphandler);

registerHandler("savefile", "click", async () => 
			new FileIO().writePointsWithPicker(elementGetValue("filename"), polygon, config.csvDelimiter));
registerHandler("start", "click", runstop);
registerHandler("restart", "click", restart);
registerHandler("step", "click", step);
registerHandler("usebezier", "click", useBezier);
registerHandler("bezierscalefactor", "input", changeBezierScale);
registerHandler("showcontrolpoints", "click", showBezierControlPoints);
registerHandler("usesymplectic", "click", checkSymplectic);
registerHandler("batchmode", "click", changeBatchMode);

registerHandler("polygontype", "change", changePolygonType);
registerHandler("speed", "change", chooseSpeed);
registerHandler("vertices", "change", chooseVertices);
registerHandler("trajectoriesmaxdepth", "change", changeTrajectoriesMaxdepth);
registerHandler("numballs", "change", changeNumBalls);
registerHandler("angle", "change", changeStartAngle);
registerHandler("batchreflections", "change", changeBatchReflections);
registerHandler("rotateangle", "input", changeRotateAngle);
registerHandler("drawingsize", "input", changeDrawingSize);

registerHandler("design", "click", switchDesignMode);			
registerHandler("pickfile", "click", pickFile);
registerHandler("cleardesign", "click", clearAllDesignMode);
registerHandler("undo", "click", undoChanges);
registerHandler("redo", "click", redoChanges);
registerHandler("copytoclipboard", "click", copyCanvasContentsToClipboard);
registerHandler("sagittafactor", "input", ChangeSagittaFactor);

// registerHandler("copycharttoclipboard", "click", copyChartContentsToClipboard);

// key up handler
function keyuphandler(event) // handle ctrl+z = undo and ctrl+y = redo
{
	if (!designMode) return;
	if (!event.ctrlKey) return; // react only on control keys
	
	if (event.key == 'z' || event.code == 'ArrowLeft' || event.code == 'Backspace')
	{
		inMemoryData = undoRedoStack.unDo();
		restart(true);
	}
	else
		if (event.key == 'y' || event.code == 'ArrowRight')
		{
			inMemoryData = undoRedoStack.reDo();
			restart(true);
		}
}

///////////////// mouse handler functions ////////////////////////////

let roundPoint = (p) => new Point(Math.round(p.x), Math.round(p.y));

let rotatePointMousePos = (x, y) => (angleRotate == 0) ? new Point(x,y) : 
						roundPoint(new PolygonExample(canvas, radians(angleRotate)).rotateBack(x, y));

function testStartPoint(p)
{
	findStartOnBorder(p); // recalc start point
	return Geometry2d.pointCloseToPoint(p, startPoint, config.balls.radius + config.balls.radiusAdd);
}

function mouseDown(e)
{
	if (e.button != 0) return; // 0 left button, 1 middle button, 2 right button
	if (/*e.altKey || */ e.shiftKey) return;

	dragindex = -1;
	dragPoint = null;

	let [x, y] = mousePosition(e);
	document.body.style.cursor = "pointer"; // cursor to hand symbol
	
	if (designMode)
	{	
 		isStartPoint = false;
		dragPoint = rotatePointMousePos(x, y);
		dragindex = Geometry2d.polygonPointCloseToPoint(inMemoryData, dragPoint, 
														config.balls.radius + config.balls.radiusAdd);
		if (dragindex < 0) // test start point first
		{
			isStartPoint = testStartPoint(new Point(x, y));
			if (!isStartPoint) // no point found, add a new point at the end
			{
				dragindex = polygon.length;
				inMemoryData = undoRedoStack.add(dragindex, dragPoint);
			}
		}
		
		stop();
		restart(!isStartPoint);
	}
	else
	{
		var p = new Point(x, y);
		isStartPoint = testStartPoint(p);
		if (!isStartPoint) 
		{
			findStartOnBorder(p);
			restart();
		}
	}
}

function mouseMove(e)
{
	if (!(designMode || isStartPoint)) // no dragging
		return;
		
	let [x, y] = mousePosition(e);
	x = Math.max(0, Math.min(canvas.width, x));
	y = Math.max(0, Math.min(canvas.height, y));
	
	if (designMode) // visualize the mouse positon
		elementSetInnerText("log", 
							`Mouse (x,y): (${Math.round(x)}, ${Math.round(y)})`);
	if (isStartPoint) // move the start point around
	{
		findStartOnBorder(new Point(x, y));
		restart();
	}
	else
		if (dragindex >= 0) // in dragging, move the polygon point around
		{
			inMemoryData.splice(dragindex, 1, rotatePointMousePos(x, y)); // replace the point at dragindex by the new one
			restart(true); // after changing a point of the polygon, start with default start point
		}
}

function mouseUp(event)
{
	let [x, y] = mousePosition(event);
	document.body.style.cursor = "default"; // cursor back to default
	if (isStartPoint)
	{
		findStartOnBorder(new Point(x, y));
		restart();
		isStartPoint = false;
	}
	else
		if (dragPoint != null && (dragPoint.x != x || dragPoint.y != y)) // is moved
		{
			inMemoryData = undoRedoStack.move(dragindex, rotatePointMousePos(x, y));
			restart(true); // restart with default point
		}
	
	dragPoint = null;
	dragindex = -1;  // stop dragging
}

function mousePosition(event)
{
	let divx = event.offsetX;
	let divy = event.offsetY;
			
	divx *= canvas.width / event.target.clientWidth; // if you shrink or expand the browser window
	divy *= canvas.height / event.target.clientHeight;
	return [Math.round(divx), Math.round(divy)];
}
//////////////////////////////////// End mouse handler ////////////

//////////////////////////////////// Design Mode ////////////

function switchDesignMode(event)
{
	designMode ? leaveDesignMode() : enterDesignMode();
}

function enterDesignMode()
{
	stop();
	designMode = true;

	if (angleRotate > 0.0) // map polygon data to inMemory data, spin data clockwise by angleRotate
	{
		let pExample = new PolygonExample(canvas, radians(angleRotate), drawingPercentSize);
		inMemoryData = polygon.map(p => pExample.rotateBack(p.x, p.y));
	}
	else
		inMemoryData = polygon;
		
	undoRedoStack = new UndoRedo(inMemoryData);

	elementSetValue("polygontype", "memorydata");
	elementSetInnerText("design", "End Design Mode");
	elementShow("cleardesign", true);
	elementShow("undo", true);
	elementShow("redo", true);
	
	restart();
}

function leaveDesignMode()
{
	stop();
	designMode = false; // terminate design mode

	elementSetInnerText("log", "") ;
	elementSetInnerText("design", "Start Design Mode");
	elementShow("cleardesign", false);
	elementShow("undo", false);
	elementShow("redo", false);
	
	restart();
}

function clearAllDesignMode(event) // clear all polygon points
{
	stop();
	undoRedoStack.clear();
	inMemoryData = [];

	restart(true); // restart with default start point
}

function undoChanges(event) // clear all polygon points
{
	stop();
	inMemoryData = undoRedoStack.unDo();
	restart(true); // restart with default start point
}

function redoChanges(event) // clear all polygon points
{
	stop();
	inMemoryData = undoRedoStack.reDo();
	restart(true); // restart with default start point
}

///////////////////////////// write to clipboard ////////////////////////////////////////
function copyCanvasContentsToClipboard(event)
{
	copyToClipboard(canvas);
}

function copyChartContentsToClipboard()
{
	copyToClipboard(elementGet("scatterchart")); // does not work at the moment, Background settings?
}


function copyToClipboard(canvas) 
{
	canvas.toBlob(async (blob) => { 
									let data = [new ClipboardItem({ 'image/png': blob })];
									await navigator.clipboard.write(data).then(
																				  () => { },
																				  (err) => alert(err)
																			   );
								  });
}

/////////////////////////////// File picker ////////////////////////////
async function pickFile(event)
{
	let rerun = isRunning();
	stop();
	
	let dc = new DataConversion();
		
	let fileIO = new FileIO();
	let [fileName, fileType, text] = await fileIO.readWithPicker();
	if (fileName == null || fileName.length == 0) 
	{
		if (rerun) 
		{
			run();
			draw(); // step = false, move = true
		}
		return;
	}
	
	let data = null;
	switch(fileType) // depending on the file's mime type choose the conversion function
	{
		case "application/json":
			data = JSON.parse(text);
			break;
		default:
		case "text/csv": 
			data = dc.parseCsvFile(text);
			break;
	}
	if (data == null) 
	{
		alert("Invalid file type or wrong file format: " + fileName);
		return;
	}

	inMemoryData = dc.scaleToCanvas(canvas, data, drawingPercentSize, config.canvasBorderSize);
	undoRedoStack = new UndoRedo(inMemoryData);
	
	elementSetValue("filename", fileName);
	elementSetValue("polygontype", "memorydata");

	restart(true); // restart with default start point 
}
///////////////////////////////////////////////////////////

function findStartOnBorder(point)
{
	if (point == null)
		return [null, config.startLambda, 0];
	
	[startPoint, startLambda, startIndex] = (useBezierCurve) ?
		BezierUtils.closestPointOnBezierCurveToPoint(point, bezierSegments) :
		Geometry2d.closestPointOnPolygonBorderToPoint(point, polygon);
}

function runstop(event)
{
	if (interval_ID == null)
		run();
	else
		stop();
}

let isRunning = () => (interval_ID != null);

function run()
{
	speed = Number(elementGetValue("speed"));
	interval_ID = setInterval(draw, config.timerMilliseconds);
	elementSetInnerText("start", "Stop");
}

function stop()
{
	clearInterval(interval_ID);
	interval_ID = null;
	elementSetInnerText("start", "Start");
}

function restart(resetBall = false)
{
	if (resetBall) startPoint = null; // forces to begin at initial start point
	init();
	draw(); // no step, move = true
}

function step(event)
{
    stop();
	draw(true); // step = true, move = true
}

function useBezier(event)
{
	// useBezierCurve = elementChecked("usebezier");
	useBezierCurve = event.target.checked;
	if (useBezierCurve)
	{
		elementShow("showcontrolpoints", true);
		elementShow("label_showcontrolpoints", true);
		elementShow("bezierscalefactor", true);
		elementShow("label_bezierscalefactor", true);
		elementShow("mark0", true);
		elementShow("mark1", true);
		elementShow("mark50", true);
	}
	else
	{
		elementShow("showcontrolpoints", false);
		elementShow("label_showcontrolpoints", false);
		elementShow("bezierscalefactor", false);
		elementShow("label_bezierscalefactor", false);
		elementShow("mark0", false);
		elementShow("mark1", false);
		elementShow("mark50", false);
	}
	
	findStartOnBorder(startPoint); // correct start point
	restart();
}

function showBezierControlPoints(event)
{
	drawBezierControlPoints = event.target.checked; // elementChecked("showcontrolpoints");
	restart();
}

function checkSymplectic(event)
{
	useSymplectic = event.target.checked; //elementChecked("usesymplectic");
	restart();
}

function batchmodeSwitch(batchmode)
{
	if (batchmode) // determine visibility of buttons and fields in html
	{
		trajectoriesMaxDepth = batchReflections + 1;
		billiardsBalls.setTrajectoriesMaxDepth(trajectoriesMaxDepth);
		
		elementShow("start", false);
		elementShow("restart", false);
		elementShow("step", false);
		elementShow("trajectoriesmaxdepth", false);
		elementShow("speed", false);
		elementShow("label_trajectoriesmaxdepth", false);
		elementShow("label_speed", false);
		
		elementSetValue("periodlength", 0); 
		elementShow("periodlength", true);
		elementShow("label_periodlength", true);
		 
		elementShow("batchreflections", true);
		elementShow("label_batchreflections", true);
	}
	else // 
	{
		trajectoriesMaxDepth = Number(elementGetValue("trajectoriesmaxdepth"));
		
		elementShow("start", true);
		elementShow("restart", true);
		elementShow("step", true);
		elementShow("trajectoriesmaxdepth", true);
		elementShow("speed", true);
		elementShow("label_trajectoriesmaxdepth", true);
		elementShow("label_speed", true);
		
		elementShow("periodlength", false);
		elementShow("label_periodlength", false); 

		elementShow("batchreflections", false);
		elementShow("label_batchreflections", false);
	}
}

function changeBatchMode(event)
{
	stop();
	batchMode = event.target.checked; //elementChecked('batchmode'); // 
	batchmodeSwitch(batchMode);
	restart();
}

function changeBatchReflections(event)
{
	batchReflections = checkAndCorrectNumValue("batchreflections");
	trajectoriesMaxDepth = batchReflections + 1;
	billiardsBalls.setTrajectoriesMaxDepth(trajectoriesMaxDepth);
	restart();
}

/****************************************************************/

function checkAndCorrectNumValue(name)
{
	let element = elementGet(name);
	let val = Number(element.value);
	
	if (element.min != 'undefined')
		val = Math.max(Number(element.min), val);
	if (element.max != 'undefined')
		val = Math.min(val, Number(element.max));
		
 	element.value = val;
 	element.innerText = val;
 	return val;
}
 
function changeNumBalls(event)
{
 	checkAndCorrectNumValue("numballs");
	restart();
}

function chooseSpeed(event)
{
 	speed = checkAndCorrectNumValue("speed");
}

function changePolygonType(event)
{
	stop();
	if (designMode) // restart designMode
	{
		leaveDesignMode();
		enterDesignMode();
	}
	restart(true);
}

function chooseVertices(event)
{
 	numVertices = checkAndCorrectNumValue("vertices");
	restart(true);
}

function changeTrajectoriesMaxdepth(event)
{
	trajectoriesMaxDepth = checkAndCorrectNumValue("trajectoriesmaxdepth");
 	billiardsBalls.setTrajectoriesMaxDepth(trajectoriesMaxDepth);
}

function changeRotateAngle(event)
{
	angleRotate = checkAndCorrectNumValue("rotateangle");
	elementSetInnerText("rotvalue", `${angleRotate}°`);
 	restart();
}

function changeDrawingSize(event)
{
	drawingPercentSize = checkAndCorrectNumValue("drawingsize");
	if (inMemoryData != null && inMemoryData.length > 0)
	{
		let dc = new DataConversion();
		inMemoryData = dc.scaleToCanvas(canvas, inMemoryData, drawingPercentSize, config.canvasBorderSize);
	}
	
	elementSetInnerText("drawingsize", `${drawingPercentSize}°`);
 	restart();
}

function changeBezierScale(event)
{
	let factor = checkAndCorrectNumValue("bezierscalefactor");
	bezierScale = factor / 100.0;
 	restart();
}

function ChangeSagittaFactor(event)
{
	let sf = elementGet("sagittafactor");
	let end = (Number(sf.max) + Number(sf.min));
	let mid = end / 2;
	
	let sagittafactor = checkAndCorrectNumValue("sagittafactor");
	sagittaHeightFactor = sagittafactor / end - 0.5; // map [1, 199] to straight line from -0.5 to 0.5
	if (Math.abs(sagittafactor - mid) <= 4) // create a tall zero area to fix the zero point better
	{
		sagittaHeightFactor = 0.0;
		elementSetValue("sagittafactor", mid);
	}
 	restart();
}

function changeStartAngle(event)
{
	checkAndCorrectNumValue("angle");
	restart();
}

function choosePolygonType(typ, numvertices, angle, drawSize)
{
	let rotangle = radians(angle);
	let polyExample = new PolygonExample(canvas, rotangle, drawSize);

	const boolvertices = (typ === 'regularpolygon' || typ === 'starpolygon' || typ === 'sawtooth');
	elementEnable('vertices', boolvertices);

	switch(typ)
	{
		case 'regularpolygon': return polyExample.RegularPolygon(numvertices);
		case 'starpolygon': return polyExample.RegularStar(numvertices);
		case 'circle': return polyExample.Circle();
		case 'ellipse': return polyExample.Ellipse();
		case 'nonconvex': return polyExample.SimpleNonConvex();
		case 'simpleconvex': return polyExample.SimpleConvex();
		case 'sawtooth': return polyExample.SawTooth(numvertices);
		case 'trapezoid': return polyExample.Trapezoid();
		case 'crossing': return polyExample.Crossing();
		case 'einsteintiles': return polyExample.EinsteinTiles();
		case 'quad1': return polyExample.Quad1Polygon();
		case 'penthouse': return polyExample.PenthousePolygon();
		case 'rectangle': return polyExample.Rectangle();
		case 'memorydata': return polyExample.fromMemory(inMemoryData);
		default: /* "rectangle": */ return polyExample.Rectangle();
	}
	return null; // should never happen
}

function setChartTitles()
{
	let title, xtitle, ytitle;
	if (useSymplectic)
	{
		title = 'Symplectic Billiards - Trajectory length by last length';
		xtitle = 'Last Trajectory length';
		ytitle = 'Actual Trajectory length';
		chart.setSuggestedXMax(1);
	}
	else
	{
		title = 'Euclidian Billiards - Trajectory length by angle';
		xtitle = 'Angle';
		ytitle = 'Trajectory length';
		chart.setSuggestedXMax(180);
	}
	chart.setTitle(title);
	chart.setAxisTitles(xtitle, ytitle);
}

function init() // will be done at each restart
{
	let numballs = Number(elementGetValue("numballs")); // get from html input field 
 	let polygontype = elementGetValue("polygontype");
 	let startangle = Number(elementGetValue("angle"));
	
	if (startPoint == null) // ensure you have valid parameters for balls
	{
		startIndex = config.startIndex;
		startLambda = config.startLambda;
	}
	
	if (drawings == null)
		drawings = new Drawings(canvas);
		
	polygon = choosePolygonType(polygontype, numVertices, angleRotate, drawingPercentSize);
	
	boundingBox = Geometry2d.calcBoundingBox(polygon);
	bezierSegments = BezierUtils.bezierCurveFromPolygon(polygon, config.bezier.bezierDegree, 
																 bezierScale);

	if (chart == null)
		chart = new Charts( elementGet("scatterchart"));
	chart.clearAllSeries();
	setChartTitles();
			
	billiardsBalls = new BilliardsBalls();
	let ballColors = config.balls.colors;
	for (let i = 0; i < numballs; i++)
	{
		let newangle = startangle + i * config.angleIncrement; // 5 degree increment;
		let color = ballColors[i % ballColors.length];
		let ball = new BilliardsBall(boundingBox, polygon, bezierSegments, startIndex,  
									 startLambda, newangle, trajectoriesMaxDepth, config.balls.radius, color, 
									 useBezierCurve, useSymplectic, sagittaHeightFactor);
		billiardsBalls.push(ball);
		
		let chartPointRadius = batchMode ? config.chart.radiusPointBatch : config.chart.radiusPoint;
		let label = `${newangle}°`;
		ball.series = chart.addChartData(label, color, chartPointRadius);
	}
}


// will be invoked by timer, see: run() or by single step
function draw(step = false, move = true)
{
	if (drawings == null) return;
	drawings.clear();
	
	if (designMode) // draw millimeter grid
		drawings.drawDesignBackground(config.designBackground);
	
	// draw the bezier curve or the polygon
	if (useBezierCurve)
		drawings.drawBezierOpt(bezierSegments, config.balls.radius, config.bezier, drawBezierControlPoints);
	else
		drawings.drawPolygon(polygon, config.polygon.color, config.polygon.lineWidth);

	if (designMode) // draw the points of the polygon
		polygon.forEach(point => drawings.drawBall(point, config.polygon.colorDesignMode, config.balls.radius));
	
	if (polygon.length < 3) return; // do nothing if we have less than 3 points
	
	// test bezier curve length function
	// 		if (useBezierCurve)
	// 		{
	// 			let val = BezierUtils.lengthBezierCurve(bezierSegments);
	// 			let polyval = Geometry2d.Circumference(polygon);
	// 			alert('Bezier length: ' + val + '; Polygon length: ' + polyval);
	// 		}

	billiardsBalls.forEach(ball => batchMode ? drawbatch(ball) : drawSingle(ball, step, move)); 
}

function drawSingle(ball, step, move = true)
{			
	let actualPos = ball.getPosition(step); // position before move
	if (!move)
	{
		drawings.drawBall(actualPos, ball.ballColor, ball.ballRadius);
		return;
	}

	let [cpoint, infopoint] = ball.moveBall(speed, step);
	if (cpoint == null) return;
	
	let nextPos = cpoint.P;

	drawings.drawBall(nextPos, ball.ballColor, ball.ballRadius);
	
	let trajectories = ball.trajectories.getAll();
	if (trajectories.length > 0)
	{
		let len = trajectories.length;
		drawings.drawTrajectories(trajectories, trajectories.length, ball.ballColor, config.trajectories.lineDash, 
								  config.trajectories.lineWidth, sagittaHeightFactor);
		drawings.drawBallLine(trajectories[0], actualPos, ball.ballColor, 1, step ? ball.getLastCircle() : ball.getCircle(), sagittaHeightFactor);
	}

	if (actualPos.x > 0 && actualPos.y > 0 && infopoint != null && 
			ball.series.length < config.chart.maxPointsScatterdiagramPerSeries)
		chart.addDataPoint(ball.series, infopoint);
}

function drawbatch(ball)
{
	drawSingle(ball, /* step = */ true); // draw the ball at initial position
	
	let savestart = ball.ballstartpoint.P; 
	let pointlast = null;
	let secondstart = null;
	let pointarray = []
	let sfirst = true;
	
	let count = 0;
	elementSetValue("periodlength", 0);
	for (let j = 0; j < batchReflections; j++)
	{
		let [cpoint, infopoint] = ball.moveBall(speed, true);
		if (infopoint != null)
			pointarray.push(infopoint);
		
		// this is done to get the periodicy ...
		if (sfirst)
		{
			secondstart = cpoint.P;
			sfirst = false;
		}
		else // look for a recurring period
		{  	
			if (CompareIt.pointsAboutEqual(pointlast, savestart))
			{
				if (CompareIt.pointsAboutEqual(cpoint.P, secondstart))
				{
					elementSetValue("periodlength", j);
					count = pointarray.length - 1;
					break; // stop when found
				}
			}
		}
		pointlast = new Point(cpoint.P);
	}
	chart.addManyPoints(ball.series, pointarray);

	let trajectories = ball.trajectories.getAll();
	if (count == 0) count = trajectories.length;
	drawings.drawTrajectories(trajectories, count, ball.ballColor, config.trajectories.lineDash, 
							  config.trajectories.lineWidth, sagittaHeightFactor);
}


// start the app .............................................
restart(true);
