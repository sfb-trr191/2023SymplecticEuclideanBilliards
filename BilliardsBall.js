/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
import { Point } from './Point.js';
import { CurvePoint } from './CurvePoint.js';
import { Geometry2d } from './Geometry2d.js';
import { BilliardsStep} from './BilliardsStep.js'
import { Trajectories } from './Trajectories.js';
import { CompareIt } from './CompareIt.js';
import { CircleArc } from './CircleArc.js';


export class BilliardsBall
{
    ballRadius = 5; 
    ballColor = '#ff0000';
    current = null;
    currentC = null;
    billiardsStep = null;
    historyMaxDepth = 0; 
    trajectories = [];      
    distance = 0;
    ballstartpoint = null;
    ballendpoint = null;
    circleArc = null;
    lastCircleArc = null;
    symplectic = false;
    
    useCircle = false;
    sagittaFactor;

    constructor(boundingBox, polygon, bezierCurveSegments, startindex, lambda1, angle, depth, ballradius, ballcolor, 
				bezier = false, symplectic = false, sagittaFactor = 0.0) 
    {
    	this.useCircle = Math.abs(sagittaFactor) > 0; 
    	this.sagittaFactor = sagittaFactor;
        this.ballRadius = ballradius;
        this.ballColor = ballcolor;
        this.current = new CurvePoint();
        this.currentC = new CurvePoint();
        this.symplectic = symplectic;
        
        this.billiardsStep = new BilliardsStep(boundingBox, polygon, bezierCurveSegments, startindex, 
											  lambda1, angle, bezier, symplectic);
        this.historyMaxDepth = depth;
        this.trajectories = new Trajectories(depth);
    }
    
    moveBall(increment, step)
	{
		let infopoint = null;

		let delta_t = CompareIt.aboutEquals(this.distance, 0.0) ? 0.0 : increment / 1.0 / this.distance;
		if (delta_t == 0.0 || this.distance == 0.0 || this.current.t >= 1.0 || step) 
		{
			this.circle = null;
			[this.current, infopoint] = this.calcNewBallDirection();
			if (this.current == null)
				return [null, null];
			this.current.t = 0.0;
			this.distance = Geometry2d.pointsEuklidDistance(this.ballstartpoint.P, this.ballendpoint.P);

			if (this.useCircle) // calc new circle: Radius and center
			{
				this.lastCircleArc = new CircleArc(this.circleArc);

				this.circleArc = new CircleArc(null, 0);

				let p1 = this.ballstartpoint.P; 
				let p2 = this.ballendpoint.P; 
				let h = Math.hypot(p2.x - p1.x, p2.y - p1.y) * this.sagittaFactor; // this is the so called 'sagitta' height of the circle segment
				
				this.circleArc.From2PointsAndSagittaHeight(p1, p2, h); // save also segment points p1, p2 in circle
				// recalc length of arc to return in infopoint
				if (this.symplectic)
				{
					let l1 = this.lastCircleArc.arcLength();
					let l2 = this.circleArc.arcLength();

					return [this.current, new Point(l1, l2)];
				}
				else
				{
					let len = this.circleArc.arcLength();
					return [this.current, new Point(infopoint.x, len)];
				}
			}
		}
		else
		{
			this.current.t += delta_t;
			let t = Math.min(this.current.t, 1.0); // prevent a drawing outside the figure
			
			this.current.P.x = (1 - t) * this.ballstartpoint.P.x + t * this.ballendpoint.P.x;
			this.current.P.y = (1 - t) * this.ballstartpoint.P.y + t * this.ballendpoint.P.y;
			// calc point on circle segment and return it
			if (this.useCircle)
			{
				let alpha = this.circleArc.calcAngle(this.current.P);
				this.currentC.P = this.circleArc.pointOnCircle(alpha);
				this.currentC.t = alpha;

				return [this.currentC, infopoint];
			}
		}
		return [this.current, infopoint];
	}

    calcNewBallDirection()
    {
    	if (this.billiardsStep.ballEndPoint == null)
			return [null, null];
        this.trajectories.add(new Point(this.billiardsStep.ballEndPoint.P)); // push a copy to line history

        let infopoint = this.billiardsStep.newBallDirection();
        
        this.current = this.billiardsStep.ballStartPoint;
        this.ballstartpoint = new CurvePoint(this.current);
        this.ballendpoint = new CurvePoint(this.billiardsStep.ballEndPoint);

        return [this.current, infopoint];
    }

    clear() 
    {
    	this.trajectories.length = 0; // clears history
        this.billiardsStep = null;
        this.current = null;
    }

    getPosition(step = false) 
    {
        return (this.useCircle && !step) ? this.currentC.P : this.current.P;
    }

//     setPosition(pos) 
//     {
//         this.current.P = pos;
//     }

    getLineStartPoint()
    {
    	if (this.ballstartpoint == null) return null;
    	return this.ballstartpoint.P;
    }

    getLineEndPoint() 
    {
    	if (this.ballendpoint == null) return null;
    	return this.ballendpoint.P;
    }

    setTrajectoriesMaxDepth(value)
    {
    	this.trajectories.setMaxDepth(value);
   	}
    
    getInfoPoint()
   	{
   		return this.infoPoint;
   	}
   	
   	getCircle()
   	{
   		return this.circleArc;
   	}
   	
   	getLastCircle()
   	{
   		return this.lastCircleArc;
   	}	
}