////////////////////////////////////////////////////////////////////////////
//
//                       Copyright (c) 2005-2020
//                       Henrik Vestermark
//                       Denmark
//
//                       All Rights Reserved 
//
//   This source file is subject to the terms and conditions of the
//   Henrik Vestermark License Agreement which restricts the manner
//   in which it may be used.
//   Mail: hve@hvks.com
//
/////////////////////////////////////////////////////////////////////////////
//
// Module name     :   	polynomialbase.js
// Module ID Nbr   :   
// Description     :   Javascript polynomial base class
// --------------------------------------------------------------------------
// Change Record   :   
//
// Version	Author/Date		Description of changes
// -------  ---------------	----------------------
// 01.01 	HVE/2006-Dec-16	Initial release
// 01.02 	HVE/2007-Apr-08	Added iterations trail to the zeros()
// 01.03 	HVE/2007-May-17	Added polynimial.pow() class method
// 01.04 	HVE/2007-Jul-12	Fixed a bug when real polynomial has zero roots
// 01.05	HVE/2007-Oct-30	Fixed a bug in intepretation of i (was i0 instead of i1)
// 01.06 	HVE/2007-Nov-25	Added composite deflation for added accuracy
// 01.07 	HVE/2008-Jul-15	Fixed a bug in testing for complex operation in Polynomial.mul()
// 01.08	HVE/2008-Jul-18 Works with IE7, FireFox 2 & 3
// 01.09	HVE/2008-Sep-5	Support Google Chrome browser
// 01.10	HVE/2009-Jan-01	Parsing bug corrected
// 01.11  	HVE/2009-Feb-24 Parsing bug corrected
// 01.12  	HVE/2009-Apr-14	Fixed a bug that caused overflow for large polynomials by limited the sz stepsize
// 01.13	HVE/2009-Jun-20 Added support for Safari by better detecting when invoke as a constructor or Conversion function
// 01.14	HVE/2009-Oct-28 Lower case e was not recognized as a exponent symbol
// 01.15	HVE/2009-Nov-16	parsing bug corrected. -x^2 become erronous x^2 while -1x^2 was handle correctly
// 01.16	HVE/2011-Jun-03 Fixed an bug in polynominal multiplication for complex coefficients
// 01.17	HVE/2011-Jun-04	Added prototype scale that scale the polynomial so first coefficients is 1
// 01.18 	HVE/2014-Mar-07 Fix a parser issue. Now allowing i^n or ii (i^2) or similar to be used in the expression
// 01.19	HVE/2014-Mar-24	Bugfixed and cleaning up the code to allow a handle large polynominal without overflow in the intermediate calculation
// 01.20	HVE/2014-Mar-26	Improve the statistics of finding the roots
// 01.21	HVE/2014-Apr-13	Improve the verbose print out
// 01.22	HVE/2017-Oct-24	Fix an error where eps was displayed in verbose mode as sqrt(eps) instead of just eps.
// 01.23	HVE/2017-Nov-25	Fix an error in upperbound for complex coefficients
// 01.24    HVE/2019-Jan-18 Added Halley, Ostrowski and Householder 3rd order as choosable methods
// 01.25    HVE/2020-Jan-29 Fixed an issue where the test for Newton convergence produced a wrong result result in failed root search. Applicable for Newton,Halley and Householder
// 01.26    HVE/2020-Feb-05 Change method scale() to monic() and create a new scale() prototype  for properly scaling of Polynomials
// End of Change Record
//
/////////////////////////////////////////////////////////////////////////////

import { Complex } from './complexbase.js';
// Depends on the complexbase.js class

export { Polynomial };


// New Polynomial Object
// Class Constructor. zero and more arguments. Guarantee that coeeficient are not undefined e.g. valid numbers or complex objects
// Can also be invoke as a conversion to Polynomial from array objects instead of as an constructor through the new operator
// Coefficients are store with c[0]=a(n)x^n, c[1]=a(n-1)x^n-1,...,c[n-1]=a(1)x,c[n]=a(0) etc
function Polynomial()
	{
//	alert(this.constructor+" typeof="+typeof this.constructor );
	if(String(this.constructor).substring(0,21)!="function Polynomial()") //||typeof this.constructor!="function")
	//if(typeof this.constructor!="function"||this.constructor=='function DOMWindow() { [native code] }') // Invoke as a Conversion function
		{
		if(arguments.length==0) return new Polynomial(); // Return empty polynomial
		if(arguments[0] instanceof Polynomial) return arguments[0]; // Arguments already a polynomial. No conversion needed
		return new Polynomial(arguments[0]); // Arguments conversion to Polynomial type
		}
		
	// Invoke as an new constructor function
	this.c=new Array(); 
	// Initialize it's new polynomial coefficients
	for(var i=0; i<arguments.length;i++)
		{
		if(arguments[i] instanceof Polynomial) 
			{this.c=this.c.concat(arguments[i].array()); }
		else
			if(arguments[i] instanceof Array) 
				this.c=this.c.concat(arguments[i]);
			else
				if(arguments[i] instanceof Complex)
				   this.c[i]=arguments[i];
				else
				   this.c[i]=Number(arguments[i]);
		}
	this.normalize();
//	this.simplify();
	}
	
// Class Prototypes
// Remove leading zeros in the polynomial
Polynomial.prototype.normalize=function() {while((this.c[0] instanceof Complex?Complex.equal(this.c[0],Complex.zero):this.c[0]==0))this.c.shift(); if(this.c.length==0)this.c[0]=0; return this;}
// Convert Complex number to real if imaginary portion is zero
Polynomial.prototype.simplify=function() {for(var i=0;i<this.c.length;i++) if(this.c[i] instanceof Complex && this.c[i].imag()==0) this.c[i]=this.c[i].real(); else if(this.c[i]==undefined) this.c[i]=0; return this;}
// Return the degree of the polynomial
Polynomial.prototype.degree=function() {return this.c.length-1;}
// Return the coefficient for x^inx
Polynomial.prototype.getcoeff=function(inx) {var i=this.c.length-1-inx; if(i<0||inx<0) return NaN; else return this.c[i]; }
// Set the coefficient for x^inx
Polynomial.prototype.setcoeff=function(inx,coeff) {var i=this.c.length-1-inx; if(i<0||inx<0) return NaN; else return this.c[i]=coeff; }
// Scale the polynominal so coefficient to a^n is 1
Polynomial.prototype.monic=function() {var scale; if(this.c.length>1) {scale=this.c[0]; if(scale instanceof Complex)
{if(!Complex.equal(scale,Complex.one))
	for(var i=0;i<this.c.length;i++) this.c[i]=Complex.div(this.c[i],scale); }
else 
{if(scale!=1)
	for(var i=0;i<this.c.length;i++) this.c[i]/=scale;}
}}
// Convert Polynomial to string
Polynomial.prototype.toString=function()
	{var ss="";
	for(var i=0;i<this.c.length;i++)
		{var n=this.c.length-i-1;
		if(this.c[i] instanceof Complex)
			{// Complex coefficients
			if(Complex.equal(this.c[i],Complex.zero)&&this.c.length>1) continue;
			ss+="+(";if(this.c[i].real()!=0||this.c[i].imag()==0) ss+=(this.c[i].real()<0?"-":"")+Math.abs(this.c[i].real());
			if(this.c[i].imag()!=0) ss+=(this.c[i].imag()<0?"-":"+")+"i"+Math.abs(this.c[i].imag());ss+=")";
			}
		else
			{//Real coefficients
			if(this.c[i]==0&&this.c.length>1) continue;
			ss+=(this.c[i]<0?"-":"+")+Math.abs(this.c[i]);
	    	}
	   if(n!=0) ss+="x";if(n>1) ss+="^"+n;
		}
	return ss;	
	}
// Convert Polynomial to string
Polynomial.prototype.toExponential=function()
	{var ss="";
	for(var i=0;i<this.c.length;i++)
		{var n=this.c.length-i-1;
		if(this.c[i] instanceof Complex)
			{// Complex coefficients
			if(Complex.equal(this.c[i],Complex.zero)&&this.c.length>1) continue;
			ss+="+(";if(this.c[i].real()!=0||this.c[i].imag()==0) ss+=(this.c[i].real()<0?"-":"")+Math.abs(this.c[i].real()).toExponential(arguments[0]);
			if(this.c[i].imag()!=0) ss+=(this.c[i].imag()<0?"-":"+")+"i"+Math.abs(this.c[i].imag()).toExponential(arguments[0]);ss+=")";
			}
		else
			{//Real coefficients
			if(this.c[i]==0&&this.c.length>1) continue;
			ss+=(this.c[i]<0?"-":"+")+Math.abs(this.c[i]).toExponential(arguments[0]);
	    	}
	   if(n!=0) ss+="x";if(n>1) ss+="^"+n;
		}
	return ss;	
	}
Polynomial.prototype.toFixed=function()
	{var ss="";
	for(var i=0;i<this.c.length;i++)
		{var n=this.c.length-i-1;
		if(this.c[i] instanceof Complex)
			{// Complex coefficients
			if(Complex.equal(this.c[i],Complex.zero)&&this.c.length>1) continue;
			ss+="+(";if(this.c[i].real()!=0||this.c[i].imag()==0) ss+=(this.c[i].real()<0?"-":"")+Math.abs(this.c[i].real()).toFixed(arguments[0]);
			if(this.c[i].imag()!=0) ss+=(this.c[i].imag()<0?"-":"+")+"i"+Math.abs(this.c[i].imag()).toFixed(arguments[0]);ss+=")";
			}
		else
			{//Real coefficients
			if(this.c[i]==0&&this.c.length>1) continue;
			ss+=(this.c[i]<0?"-":"+")+Math.abs(this.c[i]).toFixed(arguments[0]);
	    	}
	   if(n!=0) ss+="x";if(n>1) ss+="^"+n;
		}
	return ss;	
	}
Polynomial.prototype.toPrecision=function()
	{var ss="";
	for(var i=0;i<this.c.length;i++)
		{var n=this.c.length-i-1;
		if(this.c[i] instanceof Complex)
			{// Complex coefficients
			if(Complex.equal(this.c[i],Complex.zero)&&this.c.length>1) continue;
			ss+="+(";if(this.c[i].real()!=0||this.c[i].imag()==0) ss+=(this.c[i].real()<0?"-":"")+Math.abs(this.c[i].real()).toPrecision(arguments[0]);
			if(this.c[i].imag()!=0) ss+=(this.c[i].imag()<0?"-":"+")+"i"+Math.abs(this.c[i].imag()).toPrecision(arguments[0]);ss+=")";
			}
		else
			{//Real coefficients
			if(this.c[i]==0&&this.c.length>1) continue;
			ss+=(this.c[i]<0?"-":"+")+Math.abs(this.c[i]).toPrecision(arguments[0]);
	    	}
	   if(n!=0) ss+="x";if(n>1) ss+="^"+n;
		}
	return ss;	
	}
Polynomial.prototype.valueof=function() {return this.c;}
Polynomial.prototype.isReal=function()    {for(var i=0; i<this.c.length;i++) if(this.c[i] instanceof Complex) return false; return true;}
Polynomial.prototype.isComplex=function() {return !this.isReal();}
Polynomial.prototype.derivative=function()
	{var d=new Polynomial(); var n=this.degree();
	for(var i=0;i<n;i++)if(this.c[i] instanceof Complex)d.c[i]=new Complex(this.c[i].real()*(n-i),this.c[i].imag()*(n-i));else d.c[i]=this.c[i]*(n-i);
	return d;
	}
Polynomial.prototype.value=function(z) //Evaluate f(z). z can be a complex number or real number. Polynomial can be either with complex or real cooeficients 
	{
	var i, fz;
	// Polynomial evaluation	Real point		Complex point
	// Real cooefficients		Real			Complex
	// Complex cooefficients	Complex			Complex
	if(this.isReal()) // Evaluate f(z). Horner. Real coefficients only
		{
		if(z instanceof Complex)
			{// Real cooefficients and complex z
			var p,q,s,r,t;
			p=-2.0*z.real(); q=z.norm(); s=0; r=this.c[0];
			for(i=1;i<this.c.length-1;i++) { t=this.c[i]-p*r-q*s; s=r; r=t; }
			fz=new Complex(this.c[this.c.length-1]+z.real()*r-q*s, z.imag()*r);
			return fz; // Return Complex
			}
		else	
			{// Real cooefficients and real z
		    fz=this.c[0];
		    for(i=1;i<this.c.length;i++)fz=fz*z+this.c[i];
		    return fz;  // Return real;
		    }
		}
	else // Evaluate a polynominal complex coeeficients, at a real or complex number z using Horner, return complex function value
	   {var zz;	fz=Complex(this.c[0]); zz=Complex(z);
	   for(i=1;i<this.c.length;i++){fz=Complex.add(Complex.mul(fz,zz),Complex(this.c[i]));}
	   return fz; // return Complex
	   }
	}
// Deflate the polynomial with the root z (either real or complex. Polynomial can be either with complex or real cooeficients.
// Since root are found is increasing order forward deflation is stable
Polynomial.prototype.deflate=function(z) 
	{var i, n=this.degree();
	if(this.isReal())
		{
		if(z instanceof Complex)
			{ //Complex root deflation
			if(Complex.equal(z,Complex.zero)==false)
				{var r,u;
			    r=-2.0*z.real(); u=z.norm();
				this.c[1]-=r*this.c[0];
				for( i=2; i<n-1; i++ ) this.c[i]=this.c[i]-r*this.c[i-1]-u*this.c[i-2];
				this.c.length--;
				}
			}
		else // Real root deflation
			{if(z!=0) for(var r=0,i=0;i<n;i++) this.c[i]=r=r*z+this.c[i];}
   	}
	else
		{
		if(Complex.equal(Complex(z),Complex.zero)==false)
		   {var z0, zz;
	       z0=Complex.zero; zz=Complex(z);
	       for(i=0;i<n;i++) {this.c[i]=Complex.add(Complex.mul(z0,zz),Complex(this.c[i])); z0=Complex(this.c[i]);} 
		   }
		}
	this.c.length--;	
	}

// Composite deflation of a real or complex root
Polynomial.prototype.compositedeflate=function(z) 
	{var i,k,r,u,n=this.degree(); 
	var b=[]; var c=[];
	if(this.isReal())
		{
		if(z instanceof Complex)
			{ //Complex root deflation
			if(Complex.equal(z,Complex.zero)==false)
				{// Forward & Backward deflation
			   r=-2.0*z.real(); u=z.norm();
				b[0]=this.c[0]; b[1]=this.c[1]-r*b[0];
				c[n-2]=this.c[n]/u; c[n-3]=(this.c[n-1]-r*c[n-2])/u;
				for(i=2;i<n-1;i++ ) 
					{
					b[i]=this.c[i]-r*b[i-1]-u*b[i-2];
					c[n-2-i]=(this.c[n-i]-c[n-i]-r*c[n-i-1])/u;
					}
				this.c.length--;
				}
			}
		else // Real root composite deflation 
			if(z!=0)
			   {// Forward & Backward deflation
   			for(r=0,u=0,i=0;i<n;i++)
	   			{
		   		b[i]=r=r*z+this.c[i];
			   	c[n-i-1]=u=(u-this.c[n-i])/z;
				   }
				}
		//Join
		for(r=Number.MAX_VALUE,i=0;i<n;i++)
			{
			u=Math.abs(b[i])+Math.abs(c[i]);
			if(u!=0) {u=Math.abs(b[i]-c[i])/u; if(u<r){ r=u; k=i;} }
			}
		for(i=k-1;i>=0;i--) this.c[i]=b[i]; // Forward deflation coefficient
		this.c[k]=0.5*(b[k]+c[k]);
		for(i=k+1;i<n;i++) this.c[i]=c[i];	// Backward deflation coefficient
   	}
	else
		{
		if(Complex.equal(Complex(z),Complex.zero)==false)
			{var zr, zs, zz;
	      zz=Complex(z); zr=Complex.zero; zs=Complex.zero; 
		   // Backward and forward deflation
   		for(i=0;i<n;i++)
	   		{
		   	b[i]=Complex.add(Complex.mul(zr,zz),Complex(this.c[i])); zr=Complex(b[i]);
		   	c[n-i-1]=Complex.div(Complex.sub(zs,Complex(this.c[n-i])),zz); zs=Complex(c[n-i-1]);
			   }
			}
		//Join
		for(r=Number.MAX_VALUE,i=0;i<n;i++)
			{
			u=Complex(b[i]).abs()+Complex(c[i]).abs();
			if(u!=0) {u=Complex.sub(b[i],c[i]).abs()/u; if(u<r){ r=u; k=i;} }
			}
		for(i=k-1;i>=0;i--) this.c[i]=b[i]; // Forward deflation coefficient
		this.c[k]=Complex.mul(Complex(0.5),Complex.add(b[k],c[k]));
		for(i=k+1;i<n;i++) this.c[i]=c[i];	// Backward deflation coefficient
		}
	// delete b,c;
	this.c.length--;	
	}

// Convert polynomial to a new array 
Polynomial.prototype.array=function() {return this.c.concat();}
// Concat polynomial elements to form a string
Polynomial.prototype.join=function(separator) { if(arguments.length==0) return this.c.join(); else return this.c.join(separator);}	

Polynomial.prototype.scale=function(sc)
    {
    /*
    .. double ldexp(double x, int n)
    .. The ldexp() functions multiply x by 2 to the power n.
    .. double frexp(double value, int *exp);
    .. The frexp() functions break the floating-point number value into
    .. a normalized fraction and an integral power of 2.
    .. They store the integer in the int object pointed to by exp.
    .. The functions return a number x such that x has a magnitude in 
    .. the interval [1/2, 1) or 0, and value = x*(2**exp).
    */
    function frexp(arg) {
        arg=Number(arg);
        var result=[arg, 0];
        if(arg!==0 && Number.isFinite(arg)) 
            {
            absArg=Math.abs(arg);
            // Math.log2 was introduced in ES2015, use it when available
            var log2=Math.log2 || function log2 (n) {return Math.log(n)*Math.LOG2E}
            var exp=Math.max(-1023,Math.floor(log2(absArg))+1);
            var x=absArg*Math.pow(2,-exp);
            // These while loops compensate for rounding errors that sometimes occur because of ECMAScript's Math.log2's undefined precision
            // and also works around the issue of Math.pow(2, -exp) === Infinity when exp <= -1024
            while(x<0.5) {
              x*=2;
              exp--;
            }
            while(x>=1) {
              x*=0.5;
              exp++;
            }
            if(arg<0) x=-x;
            result[0]=x;
            result[1]=exp;
            }
        return result;
        }
    
  /*
  // Scale if there are large or very small coefficients
  // Computes a scale factor to multiply the coefficients of the polynomial.
  // The scaling is done to avoid overflow and to avoid undetected underflow 
  // interfering with the convergence criterion.
  // The factor is a power of the base (2).
  */var max_exponent, res,i,x,factor;
    if(sc==undefined)
        {
        max_exponent=-Number.MIN_VALUE; res=[];
        for(i=0; i<this.c.length; ++i) 
            {
            x=this.c[i]; if(x instanceof Complex) x=x.abs();
            if(x!=0) {res=frexp(x); if(res[1]>max_exponent) max_exponent=res[1];}
            factor=Math.pow(2.0,-max_exponent);
            }
        }
    else 
        factor=sc;
    
    for(i=0; i<this.c.length; ++i) {
        if(this.c[i] instanceof Complex)
            this.c[i]=Complex.mul(this.c[i],new Complex(factor));
        else
            this.c[i]*=factor;
        }
    }

// Roots
Polynomial.prototype.zeros=function(method,verbose,composite)
	{
	// Startpoint on the real axis based on polynominal with either real or complex coeeficients
	function startguess(p)
		{var r,min,u, n; n=p.degree();r=Math.log(new Complex(p.getcoeff(0)).abs());min=Math.exp((r-Math.log(new Complex(p.getcoeff(n)).abs()))/n);
		for(let i=1;i<n;i++)
			if(Complex.equal(new Complex(p.getcoeff(n-i)),Complex.zero)==false){u=Math.exp((r-Math.log(new Complex(p.getcoeff(n-i)).abs()))/(n-i));if(u<min) min=u;}
		return min;
		}
	// Alter search direction and scale step
	function changedirection(dz,m)
        { var z=new Complex(0.6,0.8);z=Complex.mul(dz,z);z=Complex.mul(z,new Complex(m));return z;}
	// Quadratic complex equation. Works for both real and complex coefficients
	// Res contains the result as complex roots. a.length is 2 or 3.
	function quadratic(p,res)
        {var v;
        if(p.degree()==1)  // a*x+b=0
            {res[1]=Complex.div(new Complex(p.getcoeff(0)).negate(),new Complex(p.getcoeff(1)));}
        else
            {var a=p.getcoeff(2), b=p.getcoeff(1), c=p.getcoeff(0);// a*x^2+b*x+c
            if(Complex.equal(new Complex(b),Complex.zero)==true) // b==0, x=sqrt(-c/a)
                {res[1]=Complex.sqrt(Complex.div(new Complex(c).negate(), new Complex(a)));res[2]=res[1].negate();}
            else
                { // v = sqrt(1-4*a*c/(b^2))
                v=Complex.sqrt(Complex.sub(Complex.one, Complex.div(Complex.mul(new Complex(4),Complex.mul(new Complex(a),new Complex(c))),Complex.mul(new Complex(b),new Complex(b)))));
                if(v.real()<0) // x=(-1-v)*b/(2*a)
                    res[1]=Complex.div(Complex.mul(Complex.sub(Complex.one.negate(),v),new Complex(b)),Complex.mul(new Complex(2),new Complex(a)));
                else // x=(-1+v)*b/(2*a)
                    res[1]=Complex.div(Complex.mul(Complex.add(Complex.one.negate(),v),new Complex(b)),Complex.mul(new Complex(2),new Complex(a)));
                res[2]=Complex.div(new Complex(c),Complex.mul(new Complex(a),res[1]));  // x2=c/(a*x1)
                }
            }
        }
	// Calculate a upper bound for the rounding errors performed in a polynomial at a complex point.( Adam's test )or Kahan for a real point
	// And finaly Grant & Hitchins for complex coefficients at a complex point
	function upperbound(pol,z)
        { var p,q,u,s,r,e,i,t, n, zz;
        n=pol.degree();	
        zz = new Complex(z);  // Force zz to be complex even if z is a real point
        if( pol.isReal() )
           {
            if(zz.imag()!=0)
                { // Complex point
                p=-2.0*zz.real(); q=zz.norm(); u=Math.sqrt(q);s=0.0; r=pol.getcoeff(n); e=Math.abs(r)*(3.5/4.5);
                for(i=1;i<n;i++) {t=pol.getcoeff(n-i)-p*r-q*s; s=r; r=t; e=u*e+Math.abs(t); }
                t=pol.getcoeff(0)+zz.real()*r-q*s;e=u*e+Math.abs(t);e=(4.5*e-3.5*(Math.abs(t)+Math.abs(r)*u)+Math.abs(zz.real())*Math.abs(r))*0.5*Math.pow(2,-53+1);
                }
            else
                { // Real Point
                t=pol.getcoeff(n); e=Math.abs(t)*(0.5);
                for(i=0;i<n;i++) {t=t*z.real()+pol.getcoeff(n-i);  e=Math.abs(z.real())*e+Math.abs(t); }
                e=(2*e-Math.abs(t))*Math.pow(2,-53+1);
                }
           }
        else
            {
            // Calculate a upper bound for the rounding errors performed in a
            // polynomial with complex coefficient a[] at a complex point z. ( Grant & Hitchins test )
            var nc, oc, nd, od, ng, og, nh, oh, v, w;
            var tol = 0.5* Math.pow(2, -53+1);
            a=new Complex(pol.getcoeff(n)); // Force a to be complex even if coeeficient is real coefficient
            oc = a.real(); od = a.imag();  
            og = oh = 1.0;
            t = Math.abs(zz.real()); u = Math.abs(zz.imag());
            for (i = 1; i <= n; i++)
                {
                a=new Complex(pol.getcoeff(n-i)); // Force a to be complex even if coeeficient is real coefficient
                nc = zz.real() * oc - zz.imag() * od + a.real();
                nd = zz.imag() * oc + zz.real() * od + a.imag();
                v = og + Math.abs(oc); w = oh + Math.abs(od);
                ng = t * v + u * w + Math.abs(a.real()) + 2.0 * Math.abs(nc);
                nh = u * v + t * w + Math.abs(a.imag()) + 2.0 * Math.abs(nd);
                og = ng; oh = nh;
                oc = nc; od = nd; 
                }
            e = Complex.abs(new Complex(ng,nh) );
            e *= Math.pow(1 + tol, 5 * n);
            e *= tol;
            //e=2*n*2.0*Complex(pol.getcoeff(0)).abs()*Math.pow( 2,-53);
            }
        return e;
        }
	// Solve quadratic equation or less directly. Works only for real coefficients
	function rquadratic(p,res)
       { var r;
       if(p.degree()==2)
          {
          if(p.getcoeff(1)==0.0)
             {
             r=-p.getcoeff(0)/p.getcoeff(2);
             if( r<0 ){res[1]= new Complex(0,Math.sqrt(-r)); res[2]= new Complex(0,-res[1].imag());}
             else {res[1]=new Complex( Math.sqrt(r),0); res[2]=new Complex(-res[1].real(),0); }
             }
          else
             {
             r=1-4*p.getcoeff(2)*p.getcoeff(0)/(Math.pow(p.getcoeff(1),2));
             if(r<0){res[1]=new Complex(-p.getcoeff(1)/(2*p.getcoeff(2)), p.getcoeff(1)*Math.sqrt(-r)/(2*p.getcoeff(2)));
             res[2]=res[1].conj();}
             else { res[1]=new Complex((-1-Math.sqrt(r))*p.getcoeff(1)/(2*p.getcoeff(2)),0);
             res[2]=new Complex(p.getcoeff(0)/(p.getcoeff(2)*res[1].real()),0);}
             }
          }
       else if(p.degree()==1) {res[1]=new Complex(-p.getcoeff(0)/p.getcoeff(1),0); } // a*x+b=0
       }
    function newton_converging(fz0,fz1,z0,z,f,ff)
        {// Determine if we are within the convergent disc as outline by Ostrowski Theorem 7.1 in the book Solutions of Equations and systems of equations
        var fwz, wz, f2, u;
        fwz=Complex.sub(fz0,fz1); wz=Complex.sub(z0,z); 
        fwz=Complex.div(fwz,wz); f2=fwz.abs(); u=fz1.abs();
        return (f2/u>u/f/2.0||ff!=f) ? false : true;
        }
    
	// Verbose. Print a complex variable
	function print_z(t,z){return t+z.toStringShort()+"\n";}
	// Print out change in dz
	function print_dz(text,dz0,dz)
        {return text+" Old dz="+(dz0.imag()==0?dz0.real().toPrecision(2):dz0.toPrecision(2))+" New dz="+(dz.imag()==0?dz.real().toPrecision(2):dz.toPrecision(2))+"\n";}
	// Verbose. Print a full iterations step using smart precision
	function print_iteration(t,z,dz,f,endl)
		{var p=15;var ss="";
		function magnitude(x){x=Math.abs(x);if(x==0) return 0;return Math.round(Math.LOG10E*Math.log(x));} // Return magnitude
		ss+=t; p=Math.max( magnitude(z.real()) ,magnitude(z.imag())  )- Math.max( magnitude(dz.real()),magnitude(dz.imag()) ); p=Math.max(0,p)+1;
		ss+= " z["+p+"]=" + (z.imag()==0?z.real().toPrecision(p):z.toPrecision(p)); ss+= " dz=" + (dz.imag()==0?dz.real().toExponential(2):dz.toExponential(2));
		// ss+= " |f(z)|=" + f.toExponential(1); if(endl==true) ss+= "\n"; 
		ss+= " |f(z)|="; /*+ f.toExponential(1); */ if(endl==true) ss+= "\n"; 

		return ss;
		}
    function try_shorten_steps(p,z0,dz,f)
        {
        var i, wz,wf, fwz, wdz, n, z_best, f_best, alter=0;	              	
        var ss=""; wdz=dz; n=p.degree(); z_best=Complex.sub(z0,dz); f_best=f;
        for(i=1;i<=n;i++)
            {
            wdz=Complex.mul(wdz,new Complex(0.5)); wz=Complex.sub(z0,wdz); 
            fwz=p.value(wz); wf=Complex.abs(fwz); 
 	        if( verbose){ss+=print_iteration("\tTry Step: ",wz,wdz,wf,true);}
    	    if(wf>=f_best)
        	   	{if(verbose){ss+= "\t        : No improvement=>Discard last try step\n";} break;}
	        f_best=wf; z_best=wz;
    	    if(verbose){ss+= "\t        : Improved=>Continue stepping\n";}
	        if(i==2)
                {
    		    wdz=changedirection(wdz,0.5);
        	    z_best=Complex.sub(z0,wdz);fwz=p.value(z_best); wf=Complex.abs(fwz);
				alter++;
      	        if( verbose){ss+=print_iteration("\t        : Probably local saddlepoint=>Alter Direction: ",z_best,wdz,wf,true);}
                break;
               	}
       	 	}  
        return [z_best,ss,alter];  // Return the dz & ss to continue the iteration with
        }
    function try_stepping(p,z,dz,f)
        {
        var i, wz,wf, fwz, wdz, n, z_best, f_best;	               	
        var ss=""; wdz=dz; z_best=wz=z; n=p.degree(); f_best=f;
        for(i=1;i<=n;i++)
            {
            wz=Complex.sub(wz,wdz); fwz=p.value(wz); wf=Complex.abs(fwz); 
 	        if(verbose){ss+=print_iteration("\tTry Step: ",wz,wdz,wf,true);}
    	    if(wf>=f_best)
        	   	{if(verbose){ss+= "\t        : No improvement=>Discard last try step\n";} break;}
	        f_best=wf; z_best=wz;
            if(verbose){ss+= "\t        : Improved=>"+(i>=n?"Reach maximum multiplicity. Stop stepping":"Continue stepping")+"\n"; }
       	 	}  
        return [z_best,ss];  // Return the dz & ss to continue the iteration 
        }
//////////////////////////////////////////////////////////////////////////////////////////////////////////
// Newton solver. Original Methode by K.Madsen BIT 1973
// Coeff is the coeeficients where coeff[0..n] in increasing power
// Solutions is the complex value of the roots in the range [1..n]
///////////////////////////////////////////////////////////////////////////////////////////////
	
	// Coeff is the complex coeeficients where coeff[0..n] in increasing power
	// Solutions is the complex value of the roots in the range [1..n]
	// form is the GUI output area
	function newton(pp,solutions,verbose,ostrowski)
  		{
   		var z0, fz0, z, dz, dz0, f1z, fz;
   		var itercnt,stage1,i;
   		var r,r0,u,f,f0,eps,f1,ff,i,n;
   		var ss="";
   		var p=new Polynomial(pp);
   		var itertrail=new Array; var stattrail=new Array;
        // Eliminate all zeros roots x==0
	   	for(;Complex.equal(new Complex(p.getcoeff(0)),Complex.zero)==true;p.deflate(0)) {solutions[p.degree()]=Complex.zero; itertrail[itertrail.length]=new Array; stattrail[stattrail.length]=undefined;}
   		while(p.degree()>2) // Loop as long as we have more than a quadratic polynominal
      		{var trail=new Array; var stat=new Object; 
            stat.iter_cnt=0; stat.stage1_cnt=0; stat.alter_cnt=0;
      		var p1=p.derivative(); 
			// Setup the iteration
			n=p.degree(); u=startguess(p);  // Find a suitable radius where all roots are outside circle with radius u
      		z0=Complex.zero; ff=f0=new Complex(p.getcoeff(0)).abs(); fz0=new Complex(p.getcoeff(1));
      		if(Complex.equal(fz0,Complex.zero)==true) z=Complex.one; else z=Complex.div(new Complex(p.getcoeff(0)).negate(),new Complex(p.getcoeff(1)));
      		z=Complex.mul(Complex.div(z,new Complex(z.abs(),0)),new Complex(u*0.5,0)); 
            dz=z; fz=p.value(z); f=Complex.abs(fz); r0=2.5*u;
      		eps=2*n*f0*Math.pow(2,-53);
      		trail.length=0;trail[trail.length]=z;		
	  		if( verbose){ss+= "Start Newton Iteration for Polynomial="+p.toString()+"\n\tStage 1=>Stop Condition. |f(z)|<" + eps.toExponential(2) + "\n";ss+=print_iteration("\tStart    :",z,dz,f,true);}
            // Start Main iteration
      		for(itercnt=0; Complex.equal(Complex.add(z,dz),z)==false && f>eps && itercnt<50;itercnt++)
         		{
		 		if(verbose){ss+= "Iteration: " + (itercnt+1) + "\n";}
		 		f1z=p1.value(z); f1=Complex.abs(f1z);
  				if(f1==0.0) { dz0=dz; dz=changedirection(dz,5.0); stat.alter_cnt++; if( verbose){ss+=print_dz("\tSaddle point detected=>Alter direction:",dz0,dz); } }
 		 		else
            		{
            		dz=Complex.div(fz,f1z); 
                    // Calculate which stage we are onfz0,fz1,z0,z,f,ff)
                    stage1=!newton_converging(fz0,f1z,z0,z,f,ff);
                    if(stage1==true) stat.stage1_cnt++;
                    // End stage calculation
					r=dz.abs();
            		if(r>r0){dz0=dz; dz=changedirection(dz,r0/r); r=dz.abs(); stat.alter_cnt++; // HVE 2009-04-14 to avoid overflow
               			if( verbose){ss+=print_dz("\tdz>dz0 =>Alter direction:",dz0,dz);}
               			}
            		r0=5*r;
            		}
        		z0=z; f0=f; fz0 =f1z;
	 			// Determine the multiplication of dz step size
				// Inner loop
				for(let domain_error=true;domain_error==true;)
	   				{
		   			domain_error=false;
            		z=Complex.sub(z0,dz); fz=p.value(z); ff=f=Complex.abs(fz);
   	       			if( verbose){ ss+=print_iteration("\tNewton Step: ",z,dz,f,true);}
				
            		if(stage1==true)   
               			{ // Try multiple steps or shorten steps depending of f is an improvment or not
                        if(verbose&&stage1==true){ss+="\tFunction value "+(f>f0?"increase=>try shorten the step":"decrease=>try multiple steps in that direction")+"\n";}
                        if(f>f0)
                            {var s,alt;
                            try{
                            [z,s,alt]=try_shorten_steps(p,z0,dz,f);
                             } catch(e) {alert("Ops. destructuring assignment not supported in current browser. Ensure Javascript ES6 is supported in your browser: "+e+"\n");}
                            stat.alter_cnt+=alt; ss+=s;
                            }
                        else
                            {var s;
                            try {
                            [z,s]=try_stepping(p,z,dz,f);
                            } catch(e) {alert("Ops. destructuring assignment not supported in current browser. Ensure Javascript ES6 is supported in your browser: "+e+"\n");}
                            ss+=s; 
                            }
                        fz=p.value(z); f=Complex.abs(fz);
               			}
					else
						{
					  	// calculate the upper bound of erros 
            	  		eps=upperbound(p,z);
            	  		if( verbose){ss+= "\tIn Stage 2=>New Stop Condition: |f(z)|<"+eps.toExponential(2)+"\n";} 
                        if(ostrowski==true)
                            {// Do the Ostrowski step as second part of the iteration. Only Stage 2
                            if( verbose){ss+= "\t        : Do the Ostrowski step\n";}	
                            var dwz = Complex.mul(fz,dz);
                            dwz=Complex.div(dwz,Complex.sub(fz0,Complex.mul(new Complex(2.0),fz)));
                            z=Complex.sub(z,dwz);
                            fz=p.value(z); f=Complex.abs(fz); dz=Complex.add(dz,dwz);
                            if( verbose){ss+=print_iteration("\tOstrowski Step: ",z,dwz,f,true);}
                            }	
    	          		}

          	 		if(r<z.abs()*Math.pow(2.0,-26.0) && f>=f0)
           	    		{
            			z=z0; dz0=dz; dz=changedirection(dz,0.5); stat.alter_cnt++;
               			if( verbose){ss+=print_dz("\tDomain Error=>Alter direction:",dz0,dz); }
	           			if(Complex.equal(Complex.add(z,dz),z)==false) domain_error=true;
               			}
					}
			trail[trail.length]=z;
         	}

		stat.iter_cnt=itercnt;
		itertrail[itertrail.length]=trail;
		stattrail[stattrail.length]=stat;
      	if(verbose){ss+= "Stop Criteria satisfied after "+itercnt+" Iterations\n";
				  ss+=print_iteration("Final Newton ",z,dz, f,true);
				  if(itercnt>=50) ss+= "Warning: Exceed limit of Iteration steps\n";
				  ss+="Alteration="+(100*stat.alter_cnt/stat.iter_cnt).toFixed(0)+"% Stage 1="+(100*stat.stage1_cnt/stat.iter_cnt).toFixed(0)+"% Stage 2="+(100-100*stat.stage1_cnt/stat.iter_cnt).toFixed(0)+"%\n";
				  }
      	if(Math.abs(z.real())>=Math.abs(z.imag())) z0=new Complex(z.real()); else z0=new Complex(0,z.imag());
      	fz=p.value(z0);
     	if( Complex.abs(fz)<=f) z=z0;

        if(p.isReal())  // Real polynomial coefficients
            {
            if(z.imag()==0)
                {// Real root 
                if(verbose){ss+=print_z("\tDeflate the real root z=",z); }
                solutions[n]=z; if(composite) p.compositedeflate(z.real()); else p.deflate(z.real());
                }
            else
                {// Complex root
                if( verbose){ss+=print_z("\tDeflate the complex conjugated root z=",z); }
                solutions[n]=z; solutions[n-1]=z.conj(); 
                if(composite) p.compositedeflate(z); else p.deflate(z);
                itertrail[itertrail.length]=z.conj();
                stattrail[stattrail.length]=undefined;
                }
            }
        else 
            {
      	    if( verbose){ss+=print_z("\tDeflate the complex root z=",z); }
            solutions[n]=z;    
	   	    // Deflate complex root
	   	    if(composite) p.compositedeflate(z); else  p.deflate(z);
            }
      	// delete p1;	//Delete p1 polynomial
      	}

	// The last 1 or 2 roots are found directly
   	if(p.degree()>0) {if(verbose){ss+= "Solve Polynomial="+p.toString()+" directly\n";} quadratic(p,solutions);}
	pp.it=itertrail;
	pp.st=stattrail;
	pp.px=new Polynomial();
	for(i=pp.degree();i>0;i--)
		{
		var px=new Polynomial(1,solutions[i].negate());
		if(i==pp.degree()) pp.px=px; else pp.px=Polynomial.mul(pp.px,px);
		}
	return ss;
   	}
//////////////////////////////////////////////////////////////////////////////////////////////////////////
// End Newton solver
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////    
// Start of Halley Solver
// Coeff is the coeeficients where coeff[0..n] in increasing power
// Solutions is the complex value of the roots in the range [1..n]
//////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Coeff is either real or  complex coeeficients where coeff[0..n] in increasing power
	// Solutions is the complex value of the roots in the range [1..n]
	// form is the GUI output area
	function halley(pp,solutions,verbose)
  		{
   		var z0, fz0, z, dz, dz0, fz1, fz2, fz, g, h;
   		var itercnt,stage1,i;
   		var r,r0,u,f,f0,eps,f1,ff,i,n;
   		var ss="";
   		var p=new Polynomial(pp);
   		var itertrail=new Array; var stattrail=new Array;
   
	   	for(;Complex.equal(new Complex(p.getcoeff(0)),Complex.zero)==true;p.deflate(0)) {solutions[p.degree()]=Complex.zero; itertrail[itertrail.length]=new Array; stattrail[stattrail.length]=undefined;}
   		while(p.degree()>2) // Loop as long as we have more than a quadratic polynominal
      		{var trail=new Array; var stat=new Object; stat.iter_cnt=0; stat.stage1_cnt=0; stat.alter_cnt=0;
      		var p1=p.derivative(); var p2=p1.derivative();
			// Setup the iteration
			n=p.degree(); u=startguess(p);  // Find a suitable radius where all roots are outside the circle with radius u
      		z0=Complex.zero; ff=f0=new Complex(p.getcoeff(0)).abs(); fz0=new Complex(p.getcoeff(1));
      		if(Complex.equal(fz0,Complex.zero)==true) z=Complex.one; else z=Complex.div(new Complex(p.getcoeff(0)).negate(),new Complex(p.getcoeff(1)));
      		z=Complex.mul(Complex.div(z,new Complex(z.abs(),0)),new Complex(u*0.5,0)); dz=z; fz=p.value(z); f=Complex.abs(fz); r0=2.5*u;
      		eps=2*n*f0*Math.pow(2,-53);
      		trail.length=0;trail[trail.length]=z;		
	  		if( verbose){ss+= "Start Halley Iteration for Polynomial="+p.toString()+"\n\tStage 1=>Stop Condition. |f(z)|<" + eps.toExponential(2) + "\n";ss+=print_iteration("\tStart    :",z,dz,f,true);}
            // Start Main iteration
      		for(itercnt=0; Complex.equal(Complex.add(z,dz),z)==false && f>eps && itercnt<50;itercnt++)
         		{
		 		if( verbose){ss+= "Iteration: " + (itercnt+1) + "\n";}
		 		fz1=p1.value(z); f1=Complex.abs(fz1);
  				if(f1==0.0) 
                    { dz0=dz; dz=changedirection(dz,5.0); stat.alter_cnt++; if( verbose){ss+=print_dz("\tSaddle point detected=>Alter direction:",dz0,dz); }
                    z=Complex.sub(z0,dz);
                    fz=p.value(z);
                    f=Complex.abs(fz);
                    continue;
                    }
 		 		else
            		{
                    g=Complex.div(fz,fz1);
                    fz2=p2.value(z);
                    h=Complex.div(fz2,fz1); h=Complex.mul(g,h);
                    h=Complex.mul(h,new Complex(0.5)); h=Complex.sub(new Complex(1),h);
                    h=Complex.div(new Complex(1),h)    
                    dz=Complex.mul(g,h);
                    // Calculate which stage we are on using fz0,fz1,z0,z,f,ff
                    stage1=!newton_converging(fz0,fz1,z0,z,f,ff); 
                    if(stage1==true) stat.stage1_cnt++;
                    // End stage calculation
                        
					r=dz.abs();
            		if(r>r0){dz0=dz; dz=changedirection(dz,r0/r); r=dz.abs(); stat.alter_cnt++; // HVE 2009-04-14 to avoid overflow
               			if( verbose){ss+=print_dz("\tdz>dz0 =>Alter direction:",dz0,dz);}
               			}
            		r0=5*r;
            		}
        		z0=z; f0=f; fz0=fz1;
	 			// Determine the multiplication of dz step size
				// Inner loop
				for(let domain_error=true;domain_error==true;)
	   				{
		   			domain_error=false;
            		z=Complex.sub(z0,dz); fz=p.value(z); ff=f=Complex.abs(fz);
   	       			if( verbose){ ss+=print_iteration("\tHalley Step: ",z,dz,f,true);}
				
            		if(stage1==true)   
               			{ // Try multiple steps or shorten steps depending of f is an improvment or not
                        if(verbose&&stage1==true){ss+="\tFunction value "+(f>f0?"increase=>try shorten the step":"decrease=>try multiple steps in that direction")+"\n";}
                        if(f>f0)
                            {var s,alt;
                            try{
                            [z,s,alt]=try_shorten_steps(p,z0,dz,f);
                             } catch(e) {alert("Ops. destructuring assignment not supported in current browser. Ensure Javascript ES6 is supported in your browser: "+e+"\n");}
                            stat.alter_cnt+=alt; ss+=s;
                            }
                        else
                             {// Try multiple steps in the same direction optmizing multiple roots iterations
                            for(var m=2;m<=n;m++)
                                {
                               var wz, fwz, fw; wz=Complex.mul(g,Complex.div(new Complex(1),Complex.sub(new Complex((m+1)/(2*m)),h)));
                                wz=Complex.sub(z0,wz); fwz=p.value(wz); fw=Complex.abs(fwz);
                                if(verbose){ss+=print_iteration("\tTry Step: ",wz,dz,fw,true);}
                                if(fw>=f)
                                  {if( verbose){ss+= "\t        : No improvement=>Discard last try step\n";}break;}
                                z=wz;
                                if(verbose){ss+= "\t        : Improved=>"+(m>=n?"Reach maximum multiplicity. Stop stepping":"Continue stepping")+"\n"; }
                                }
                            } 
                        fz=p.value(z); f=Complex.abs(fz);
               			}
					else
						{
					  	// calculate the upper bound of erros using Adam's test
            	  		eps=upperbound(p,z);
            	  		if( verbose){ss+= "\tIn Stage 2=>New Stop Condition: |f(z)|<"+eps.toExponential(2)+"\n";}  
    	          		}

          	 		if(r<z.abs()*Math.pow(2.0,-26.0) && f>=f0)
           	    		{
            			z=z0; dz0=dz; dz=changedirection(dz,0.5); stat.alter_cnt++;
               			if( verbose){ss+=print_dz("\tDomain Error=>Alter direction:",dz0,dz); }
	           			if(Complex.equal(Complex.add(z,dz),z)==false) domain_error=true;
               			}
					}
			trail[trail.length]=z;
         	}

		stat.iter_cnt=itercnt;
		itertrail[itertrail.length]=trail;
		stattrail[stattrail.length]=stat;
      	if(verbose){ss+= "Stop Criteria satisfied after "+itercnt+" Iterations\n";
				  ss+=print_iteration("Final Halley ",z,dz, f,true);
				  if(itercnt>=50) ss+= "Warning: Exceed limit of Iteration steps\n";
				  ss+="Alteration="+(100*stat.alter_cnt/stat.iter_cnt).toFixed(0)+"% Stage 1="+(100*stat.stage1_cnt/stat.iter_cnt).toFixed(0)+"% Stage 2="+(100-100*stat.stage1_cnt/stat.iter_cnt).toFixed(0)+"%\n";
				  }
      	if(Math.abs(z.real())>=Math.abs(z.imag())) z0=new Complex(z.real()); else z0=new Complex(0,z.imag());
      	fz=p.value(z0);
     	if( Complex.abs(fz)<=f) z=z0;
        if(p.isReal())  // Real polynomial coefficients
            {
            if(z.imag()==0)
                {// Real root 
                if(verbose){ss+=print_z("\tDeflate the real root z=",z); }
                solutions[n]=z; if(composite) p.compositedeflate(z.real()); else p.deflate(z.real());
                }
            else
                {// Complex root
                if( verbose){ss+=print_z("\tDeflate the complex conjugated root z=",z); }
                solutions[n]=z; solutions[n-1]=z.conj(); 
                if(composite) p.compositedeflate(z); else p.deflate(z);
                itertrail[itertrail.length]=z.conj();
                stattrail[stattrail.length]=undefined;
                }
            }
        else 
            {
      	    if( verbose){ss+=print_z("\tDeflate the complex root z=",z); }
             solutions[n]=z;    
	   	    // Deflate complex root
	   	    if(composite) p.compositedeflate(z); else  p.deflate(z);
            }
      	// delete p1, p2;	//Delete p1 & p2 polynomial
      	}

	// The last 1 or 2 roots are found directly
   	if(p.degree()>0) {if(verbose){ss+= "Solve Polynomial="+p.toString()+" directly\n";} quadratic(p,solutions);}
	pp.it=itertrail;
	pp.st=stattrail;
	pp.px=new Polynomial();
	for(i=pp.degree();i>0;i--)
		{
		var px=new Polynomial(1,solutions[i].negate());
		if(i==pp.degree()) pp.px=px; else pp.px=Polynomial.mul(pp.px,px);
		}
	return ss;
   	}
// End of Harley Solver
  //////////////////////////////////////////////////////////////////////////////////////////////////////////    
// Start of Householder Solver
// Coeff is the coeeficients where coeff[0..n] in increasing power
// Solutions is the complex value of the roots in the range [1..n]
//////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Coeff is either real or  complex coeeficients where coeff[0..n] in increasing power
	// Solutions is the complex value of the roots in the range [1..n]
	// form is the GUI output area
	function householder(pp,solutions,verbose)
  		{
   		var z0, fz0, z, dz, dz0, fz1, fz2, fz3, fz, g, h, t, u , v;
   		var itercnt,stage1,i;
   		var r,r0,u,f,f0,eps,f1,ff,i,n;
   		var ss="";
   		var p=new Polynomial(pp);
   		var itertrail=new Array; var stattrail=new Array;
   
	   	for(;Complex.equal(new Complex(p.getcoeff(0)),Complex.zero)==true;p.deflate(0)) {solutions[p.degree()]=Complex.zero; itertrail[itertrail.length]=new Array; stattrail[stattrail.length]=undefined;}
   		while(p.degree()>2) // Loop as long as we have more than a quadratic polynominal
      		{var trail=new Array; var stat=new Object; stat.iter_cnt=0; stat.stage1_cnt=0; stat.alter_cnt=0;
      		var p1=p.derivative(); var p2=p1.derivative(); var p3=p2.derivative();
			// Setup the iteration
			n=p.degree(); u=startguess(p);  // Find a suitable radius where all roots are outside the circle with radius u
      		z0=Complex.zero; ff=f0=new Complex(p.getcoeff(0)).abs(); fz0=new Complex(p.getcoeff(1));
      		if(Complex.equal(fz0,Complex.zero)==true) z=Complex.one; else z=Complex.div(new Complex(p.getcoeff(0)).negate(),new Complex(p.getcoeff(1)));
      		z=Complex.mul(Complex.div(z,new Complex(z.abs(),0)),new Complex(u*0.5,0)); dz=z; fz=p.value(z); f=Complex.abs(fz); r0=2.5*u;
      		eps=2*n*f0*Math.pow(2,-53);
      		trail.length=0;trail[trail.length]=z;		
	  		if( verbose){ss+= "Start Householder Iteration for Polynomial="+p.toString()+"\n\tStage 1=>Stop Condition. |f(z)|<" + eps.toExponential(2) + "\n";ss+=print_iteration("\tStart    :",z,dz,f,true);}
            // Start Main iteration
      		for(itercnt=0; Complex.equal(Complex.add(z,dz),z)==false && f>eps && itercnt<50;itercnt++)
         		{
		 		if( verbose){ss+= "Iteration: " + (itercnt+1) + "\n";}
		 		fz1=p1.value(z); f1=Complex.abs(fz1);
  				if(f1==0.0) 
                    { dz0=dz; dz=changedirection(dz,5.0); stat.alter_cnt++; if( verbose){ss+=print_dz("\tSaddle point detected=>Alter direction:",dz0,dz); }
                    z=Complex.sub(z0,dz);
                    fz=p.value(z);
                    f=Complex.abs(fz);
                    continue;
                    }
 		 		else
            		{
                    t=Complex.div(fz,fz1);
                    fz2=p2.value(z);
                    u=Complex.div(fz2,fz1);
                    fz3=p3.value(z);
                    v=Complex.div(fz3,fz1);
                    g=Complex.sub(new Complex(1),Complex.mul(new Complex(0.5),Complex.mul(u,t)));    
                    h=Complex.mul(v,Complex.mul(t,new Complex(1.0/6.0)));
                    h=Complex.sub(u,h);
                    h=Complex.mul(t,h);
                    h=Complex.sub(new Complex(1),h);
                    dz=Complex.mul(t,Complex.div(g,h));
                    // Calculate which stage we are on using fz0,fz1,z0,z,f,ff
                    stage1=!newton_converging(fz0,fz1,z0,z,f,ff); 
                    if(stage1==true) stat.stage1_cnt++;
                    // End stage calculation
                        
					r=dz.abs();
            		if(r>r0){dz0=dz; dz=changedirection(dz,r0/r); r=dz.abs(); stat.alter_cnt++; // HVE 2009-04-14 to avoid overflow
               			if( verbose){ss+=print_dz("\tdz>dz0 =>Alter direction:",dz0,dz);}
               			}
            		r0=5*r;
            		}
        		z0=z; f0=f; fz0=fz1;
	 			// Determine the multiplication of dz step size
				// Inner loop
				for(let domain_error=true;domain_error==true;)
	   				{
		   			domain_error=false;
            		z=Complex.sub(z0,dz); fz=p.value(z); ff=f=Complex.abs(fz);
   	       			if( verbose){ ss+=print_iteration("\tHouseholder Step: ",z,dz,f,true);}
				
            		if(stage1==true)   
               			{ // Try multiple steps or shorten steps depending of f is an improvment or not
                        if(verbose&&stage1==true){ss+="\tFunction value "+(f>f0?"increase=>try shorten the step":"decrease=>try multiple steps in that direction")+"\n";}
                        if(f>f0)
                            {var s,alt;
                            try{
                            [z,s,alt]=try_shorten_steps(p,z0,dz,f);
                             } catch(e) {alert("Ops. destructuring assignment not supported in current browser. Ensure Javascript ES6 is supported in your browser: "+e+"\n");}
                            stat.alter_cnt+=alt; ss+=s;
                            }
                        else
                             {// Try multiple steps in the same direction optmizing multiple roots iterations
                            for(var m=2;m<=n;m++)
                                {
                               var wz, fwz, fw;
                                wz=Complex.mul(new Complex((m+2)/3.0),dz);
                                wz=Complex.sub(z0,wz); fwz=p.value(wz); fw=Complex.abs(fwz);
                                if(verbose){ss+=print_iteration("\tTry Step: ",wz,dz,fw,true);}
                                if(fw>=f)
                                  {if( verbose){ss+= "\t        : No improvement=>Discard last try step\n";}break;}
                                z=wz;
                                if(verbose){ss+= "\t        : Improved=>"+(m>=n?"Reach maximum multiplicity. Stop stepping":"Continue stepping")+"\n"; }
                                }
                            } 
                        fz=p.value(z); f=Complex.abs(fz);
               			}
					else
						{
					  	// calculate the upper bound of erros using Adam's test
            	  		eps=upperbound(p,z);
            	  		if( verbose){ss+= "\tIn Stage 2=>New Stop Condition: |f(z)|<"+eps.toExponential(2)+"\n";}  
    	          		}

          	 		if(r<z.abs()*Math.pow(2.0,-26.0) && f>=f0)
           	    		{
            			z=z0; dz0=dz; dz=changedirection(dz,0.5); stat.alter_cnt++;
               			if( verbose){ss+=print_dz("\tDomain Error=>Alter direction:",dz0,dz); }
	           			if(Complex.equal(Complex.add(z,dz),z)==false) domain_error=true;
               			}
					}
			trail[trail.length]=z;
         	}

		stat.iter_cnt=itercnt;
		itertrail[itertrail.length]=trail;
		stattrail[stattrail.length]=stat;
      	if(verbose){ss+= "Stop Criteria satisfied after "+itercnt+" Iterations\n";
				  ss+=print_iteration("Final Householder ",z,dz, f,true);
				  if(itercnt>=50) ss+= "Warning: Exceed limit of Iteration steps\n";
				  ss+="Alteration="+(100*stat.alter_cnt/stat.iter_cnt).toFixed(0)+"% Stage 1="+(100*stat.stage1_cnt/stat.iter_cnt).toFixed(0)+"% Stage 2="+(100-100*stat.stage1_cnt/stat.iter_cnt).toFixed(0)+"%\n";
				  }
      	if(Math.abs(z.real())>=Math.abs(z.imag())) z0=new Complex(z.real()); else z0=new Complex(0,z.imag());
      	fz=p.value(z0);
     	if( Complex.abs(fz)<=f) z=z0;
        if(p.isReal())  // Real polynomial coefficients
            {
            if(z.imag()==0)
                {// Real root 
                if(verbose){ss+=print_z("\tDeflate the real root z=",z); }
                solutions[n]=z; if(composite) p.compositedeflate(z.real()); else p.deflate(z.real());
                }
            else
                {// Complex root
                if( verbose){ss+=print_z("\tDeflate the complex conjugated root z=",z); }
                solutions[n]=z; solutions[n-1]=z.conj(); 
                if(composite) p.compositedeflate(z); else p.deflate(z);
                itertrail[itertrail.length]=z.conj();
                stattrail[stattrail.length]=undefined;
                }
            }
        else 
            {
      	    if( verbose){ss+=print_z("\tDeflate the complex root z=",z); }
             solutions[n]=z;    
	   	    // Deflate complex root
	   	    if(composite) p.compositedeflate(z); else  p.deflate(z);
            }
      	// delete p1, p2, p3;	//Delete p1, p2 & p3 polynomial
      	}

	// The last 1 or 2 roots are found directly
   	if(p.degree()>0) {if(verbose){ss+= "Solve Polynomial="+p.toString()+" directly\n";} quadratic(p,solutions);}
	pp.it=itertrail;
	pp.st=stattrail;
	pp.px=new Polynomial();
	for(i=pp.degree();i>0;i--)
		{
		var px=new Polynomial(1,solutions[i].negate());
		if(i==pp.degree()) pp.px=px; else pp.px=Polynomial.mul(pp.px,px);
		}
	return ss;
   	}
// End of Householder Solver

    // Main of zeros function
	if(this.c!=undefined&&this.degree()>0)
		{var solutions = new Array;
         if(method==undefined) method="newton";
         switch(method)
             {
             case "Newton":         solutions[0]=newton(this,solutions,verbose,false); break;  
             case "Ostrowski":      solutions[0]=newton(this,solutions,verbose,true); break; 
             case "Halley":         solutions[0]=halley(this,solutions,verbose); break; 
             case "Householder":    solutions[0]=householder(this,solutions,verbose); break; 
             case "JenkinsTraub":   solutions[0]=jenkinstraub(this,solutions,verbose); break; 
             case "Laguerre":       solutions[0]=laguerre(this,solutions,verbose,composite); break; 
             case "DurandKerner":       solutions[0]=durandkerner(this,solutions,verbose,composite); break;        
             default: alert("Unknow solution method "+method);
             }
		return solutions;
		}
	return new Array();
	}
	
// Class Methods
Polynomial.add = function(a,b) 
	{var i, ac, bc, na, nb, nc; var c=new Polynomial(); na=a.degree(); nb=b.degree(); nc=Math.max(na,nb); c.c.length=nc+1;
	for(i=0;i<=Math.min(na,nb);i++) {ac=a.getcoeff(i);  bc=b.getcoeff(i); if(ac instanceof Complex||bc instanceof Complex) c.setcoeff(i,Complex.add(new Complex(ac),new Complex(bc)));else c.setcoeff(i,ac+bc); }
	for(;i<=nc;i++) c.setcoeff(i,(na>nb?a.getcoeff(i):b.getcoeff(i)));
	return c.normalize(); 
	}
Polynomial.sub=function(a,b)
	{var i, ac, bc, na, nb, nc; var c=new Polynomial(); na=a.degree(); nb=b.degree(); nc=Math.max(na,nb); c.c.length=nc+1;
	for(i=0;i<=Math.min(na,nb);i++) {ac=a.getcoeff(i);  bc=b.getcoeff(i); if(ac instanceof Complex||bc instanceof Complex) c.setcoeff(i,Complex.sub(new Complex(ac),new Complex(bc)));else c.setcoeff(i,ac-bc); }
	for(;i<=nc;i++) if(na>nb) c.setcoeff(i,a.getcoeff(i)); else {bc=b.getcoeff(i); if(bc instanceof Complex) bc=bc.negate(); else bc=-bc; c.setcoeff(i,bc);}
	return c.normalize(); 
	}
Polynomial.mul=function(a,b) 
	{var na, nb;  var c;
	na=a.degree(); nb=b.degree(); c=new Polynomial(); for(var i=0;i<=na+nb;i++) c.c[i]=0;
	for(var i=0;i<=na;i++) for(var j=0;j<=nb;j++)
		{ 
		if(a.c[i] instanceof Complex || b.c[j] instanceof Complex || c.c[i+j] instanceof Complex)
			c.c[i+j]=Complex.add(new Complex(c.c[i+j]),Complex.mul(new Complex(a.c[i]), new Complex(b.c[j])))
		else
			c.c[i+j]+=a.c[i]*b.c[j];
		}
	return c.normalize();
	}
Polynomial.div=function(a,b) 
	{var na, nb, nq;  var q,r;
	na=a.degree(); nb=b.degree();
	q=new Polynomial(); r=new Polynomial(a); nq=na-nb;
	for(var k=0;k<=nq;k++)
		{
		q.c[k]=r.c[k]/b.c[0];
		for(var j=0;j<=nb;j++) r.c[j+k]-=q.c[k]*b.c[j];
		}
	return q.normalize();
	}
Polynomial.rem=function(a,b) 
	{var na, nb, nq;  var q,r;
	na=a.degree(); nb=b.degree();
	q=new Polynomial(); r=new Polynomial(a); nq=na-nb;
	for(var k=0;k<=nq;k++)
		{
		q.c[k]=r.c[k]/b.c[0];
		for(var j=0;j<=nb;j++) r.c[j+k]-=q.c[k]*b.c[j];
		}
	r.c=r.c.slice(nq);
	return r.normalize();
	}
Polynomial.pow=function(a,n) 
	{var r =new Polynomial(1);
	if(n==0) return r;
	var p=new Polynomial(a); 
	for(var k=n;k>0;k>>=1)
		{
		if(k&0x1)
			r=Polynomial.mul(r,p);
		p=Polynomial.mul(p,p);
		}
	return r;
	}

// Class properties
Polynomial.zero=new Polynomial();
Polynomial.one=new Polynomial(1);

var e_errors;
var error_msg;
// This function parse a polynomial expression
function parsePolynomial(arg)
	{
	var dbl=0;			// Debug Level
	var depth=0; 		// Recusive dept of functions calls
	var err=0; 			// Number of errors in parsing expression
	var err_msg=new Array;		// Error message
	var coeff=new Polynomial;
	// Since EI string.split produce non standard result this function simulate correct behavior for all browsers
	function splitexpression(arg)
		{
		var re=/([\+\-\*\/\%\(\)\^=xXiI])/g;
		var input=new Array;
		var fi=0;	
		while((r=re.exec(arg))!=null)
			{ 
			if(fi<r.index)
				{var a;
				a=arg.slice(fi,r.index);
				if((a=a.replace(/\s+/g,"")).length!=0) input[input.length]=a;
				}
			input[input.length]=r[0]; 
			fi=re.lastIndex;
			}
		// Take last argument if any 
		{var a;
		a=arg.slice(fi);
		if((a=a.replace(/\s+/g,"")).length!=0) input[input.length]=a;
		}
		if(dbl>4){var ss=""; for(var i=0;i<input.length;i++) ss+=String(input[i].length)+"|"+input[i]+"|\n"; alert("Splitting details:\n"+ss);}
		if(dbl>2) alert("Splitting:"+arg+":"+input.join(":")+"#");
		return input;
		}
	function next(a) // Find next non white space terminal symbol and remove wite spaces
		{while( a.length>0 && (a[0]=a[0].replace(/\s+/g,"")).length==0 ) a.shift(); return a[0];}
	function rpsyntax(ca,t,f,ht)	// Report Syntax error
		{var xdbl=dbl; dbl=0; var sp=splitexpression(arg); dbl=xdbl; var ss=sp.slice(0,sp.length-ca.length); err_msg[err]="["+f+"] Syntax Error: "+t+"\nFound near:'"+ss.join("")+"|"+ca.join("")+"'"; err++;if(ht==undefined) ht=="";
		if(dbl>=0) alert("Oops!\n"+err_msg[err-1]+ht); }
	function constant(a,xflg) // Cosntant() is now a true constant parsing. No i or I
		{ var n, sign=1, v=NaN; var fe=/^(([\d]+([\.][\d]*)?)|([\.][\d]+))([eE][\d]*)?$/; 
		n=next(a); if(n=="+"||n=="-") { if(n=="-") sign=-1; a.shift(); n=next(a); }	//alert("n="+n+" "+fe.test(n));	
		if(fe.test(n)) // Is a integer or float number?
			{
			if(!isNaN(parseFloat(n)) && n.charAt(n.length-1).toLowerCase()=="e")
				{// Need to be an optional sign and an integer
				a.shift();
				if(a.length>0 && (a[0]=="+" || a[0]=="-" )){ n+=a[0]; a.shift(); }
				if(a.length>0 && !isNaN(parseInt(a[0])))   { n+=a[0]; }
				else rpsyntax(a,"Missing exponent constant.","constant","\nA exponent constant is of the form E<number>, E+<number> or E-<number>\nE.g. 1E+2, 7E-09, 3E4 etc. A E can either be uppercase E or lowercase e. Just an E followed by no number is illegal.");
				}
			v=parseFloat(n);
			if(isNaN(v)) rpsyntax(a,"Not a Number. "+n,"constant"); else a.shift();
			v=sign*v;
			}
		else // Not a float number. Check for an implicit number
			{var xx=/^[xXiI]+$/; 
			if(xflg&&xx.test(n)) v=sign; else rpsyntax(a,"Missing Number.","constant","\nWe expected a integer or floating point number here.\nE.g. 2, 12.23, -7.2E-5, +4E4 or similar.");
			}
		return v;
		}
	function Expression(a) {var v; v=SimpelExpression(a); return v;	}	
	function SimpelExpression(a) {var v; v=Term(a); v=ExpressionPrime(a,v); return v; }
	function ExpressionPrime(a,v)
		{var t;
		if(dbl>=3) alert("Expression Prime begin:"+v.toString()+" with symbol:"+a[0]);			
		switch(a[0]){
			case "+": a.shift(); t=Term(a); v=Polynomial.add(v,t); v=ExpressionPrime(a,v);	break;
			case "-": a.shift(); t=Term(a); v=Polynomial.sub(v,t); v=ExpressionPrime(a,v);	break
			}
		if(dbl>=2) alert("Expression Prime returns:["+v.c.length+"]"+v.toString());			
		return v;
		}
	function Term(a) {var v; v=Factor(a); v=TermPrime(a,v); return v;}
	function TermPrime(a,v)
		{var t; var xx=/^[\d]+/; 
		if(dbl>=2) alert("Term Prime begin:"+v.toString()+" with symbol:"+a[0]);		
		switch(a[0])
			{
			case "i": /* Implicit multiplication */
			case "I": /* Implicit multiplication */
					t=new Complex(0,1); t=new Polynomial(t); a.shift(); tp=Number(1);
					while(a[0]=="^") { a.shift(); tp*=constant(a,false); }
					if((tp instanceof Complex) || Number(tp)!=Math.round(tp)) {rpsyntax(a,"; "+tp+" Power of i needs to be a integer.","Termprime","\nA power exponent needs to be an integer.\nE.g. 3, +2, 4 or similar"); tp=0;}
					t=Polynomial.pow(t,tp); v=Polynomial.mul(v,t);
					// Test for an implict multiplication with a factor af i
					if(xx.test(a[0])) { t=constant(a,false); t=new Polynomial(t); v=Polynomial.mul(v,t); }
					v=TermPrime(a,v); break;
			case "x": /* Implicit multiplication */
			case "X": /* Implicit multiplication */
					t=new Polynomial(1,0); a.shift(); tp=Number(1);
					while(a[0]=="^") { a.shift(); tp*=constant(a,false); }
					if((tp instanceof Complex) || Number(tp)!=Math.round(tp)) {rpsyntax(a,"; "+tp+" Power of X needs to be a integer.","Termprime","\nA power exponent needs to be an integer.\nE.g. 3, +2, 4 or similar"); tp=0;} 
		 			for(tp--;tp>0;tp--) t.c.push(0); v=Polynomial.mul(v,t);
					if(xx.test(a[0])) { t=constant(a,false); t=new Polynomial(t); v=Polynomial.mul(v,t); }
					v=TermPrime(a,v); break
			case "(": /* Implicit multiplication */
			case "*": if(a[0]=="*") a.shift(); t=Factor(a); v=Polynomial.mul(v,t); v=TermPrime(a,v); break;
			case "/": a.shift(); t=Factor(a); v=Polynomial.div(v,t); v=TermPrime(a,v); break;
			case "%": a.shift(); t=Factor(a); v=Polynomial.rem(v,t); v=TermPrime(a,v); break;
			}
		if(dbl>=2) alert("Term Prime returns:"+v.toString());		
		return v;
		}
	function Factor(a) {var v; v=PrimaryExpression(a); v=FactorPrime(a,v); return v; }
	function FactorPrime(a,v)  
		{var t;
		if(dbl>=3) alert("Factor Prime begin:"+v.toString()+" with symbol:"+a[0]);			
		if(a[0]=="^")
			{
			a.shift(); t=constant(a,false); if(!(t instanceof Complex) && Number(t)==Math.round(t)) {v=Polynomial.pow(v,t);} else	rpsyntax(a,"; "+t+" Power of operator ^ needs to be an integer.","FactorPrime","\nA power of an operator ^ needs to be an integer.\nE.g. 2^3, 2^-2, 3^+4 or similar");
			v=FactorPrime(a,v);
			}
		if(dbl>=2) alert("Factor Prime returns:"+v.toString());			
		return v;
		}	
	function PrimaryExpression(a)
		{var v=NaN; var pl;
		if(dbl>=3) alert("Primary Expression begin:"+v.toString()+" with symbol:"+a[0]);
		switch(next(a))
			{
			case "(": a.shift(); v=Expression(a); if(a[0]==")") a.shift(); else rpsyntax(a,"Missing ) in expression.","PrimaryExpression","\nA closing ) is missing to balance the expression"); break;
			default: v=constant(a,true); if(!(v instanceof Polynomial)) v=new Polynomial(v); break;
			}
		if(dbl>=2) alert("Primary Expression returns:["+v.c.length+"] "+v.toString());
		return v;	
		}	
	
	var ip=splitexpression(arg);
	var value=Expression(ip);
	if(ip.length>0&&ip[0]!="") rpsyntax(ip,"Missing Operator.","CE");
	if(dbl>=2) alert("After parsePolynomial:"+value.toString());
	e_errors=err;
	error_msg=err_msg[0];
	return value;
	}
	