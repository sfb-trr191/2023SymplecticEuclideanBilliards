////////////////////////////////////////////////////////////////////////////
//
//                       Copyright (c) 2005-2018
//                       Future Team Aps 
//                       Denmark
//
//                       All Rights Reserved
//
//   This source file is subject to the terms and conditions of the
//   Future Team Software License Agreement which restricts the manner
//   in which it may be used.
//   Mail: hve@hvks.com
//
/////////////////////////////////////////////////////////////////////////////
//
// Module name     :   complexbase.js
// Module ID Nbr   :   
// Description     :   Javascript complex base class
// --------------------------------------------------------------------------
// Change Record   :   
//
// Version	Author/Date		Description of changes
// -------  ---------------	----------------------
// 01.01	HVE/2005-Oct-14	Initial release
// 01.02	HVE/2006-Oct-14	Fixed a syntax error in toFixed
// 01.03	HVE/2006-Oct-30	Add Complex Trigonometric and Complex hyberbolic functions
// 01.04	HVE/2008-Jul-18	Support of FireFox 3
// 01.05	HVE/2008-Sep-5	Support Google Chrome browser
// 01.06	HVE/2009-Jun-20 Added support for Safari by better detecting when invoke as a constructor or Conversion function
// 01.07	HVE/2014-Mar-23	Added Complex.abs() taking both a float and Complex object
// 01.08	HVE/2014-Mar-24	Fix and error in Complex.abs() that could sometimes give NaN as the result. Also added that you can use an argument in z.real() or z.imag(). if z.real(2) then you assign the value 2 to this.x and return that value
// 01.09	HVE/2018-Feb-18	Added complex version of asin(), acos(), atan(), asinh(), acosh(), atanh()
// 01.10	HVE/2018-Feb-19	Fixed an error with sqrt(0+i0) return NaN instead of (0+i0)
// 01.11	HVE/2018-Apr-20	A comple division with zero now returns (Infinity+iinfinity) instead of (NaN+iNaN)
// 01.12	HVE/2018-May-31 Fix a bug in parseComplex() if the iI was after te number and not before
// 01.13	HVE/2018-Aug-03 Added support for Complex.gamma(z), Complex.lgamma(z),Math.gamma(x) and Math.lgamma(x)
// 01.14	HVE/2018-Oct-19	handle cases where the webbrowser support sinh(),cosh(),tanh(),gamma(),lgamma & beta()
//
// End of Change Record
//
/////////////////////////////////////////////////////////////////////////////

// export { Complex };
// New Complex Object
// Class Constructor. accept 2,1 and zero arguments. Guarantee that x,y is valid numbers (not undefined). 
// Can also be invoke as a conversion to Complex instead of as an constructor through the new operator


export function Complex()
	{
	
	if(String(this.constructor).substring(0,18)!="function Complex()") 
	{// Invoked as Conversion
		if(typeof arguments[0]=="object" && arguments[0].constructor==Complex ) return arguments[0]; 
		else if(arguments.length>=2) return new Complex(arguments[0],arguments[1]);
		 else if(arguments.length==1) return new Complex(arguments[0]); 
		 else return new Complex();
	} 
	// Invoke as an new constructor function
	if(arguments.length>=2){this.x=Number(arguments[0]); this.y=Number(arguments[1]);}
	else if(arguments.length==1){this.x=Number(arguments[0]);this.y=0;} else {this.x=0;this.y=0;}
	if(this.x==undefined) this.x=0; if(this.y==undefined) this.y=0;
	}
	
// Class properties
Complex.zero = new Complex();
Complex.one = new Complex(1);
Complex.i= new Complex(0,1);		
	
// Class Prototypes
Complex.prototype.norm=function() { return this.x*this.x+this.y*this.y; }
Complex.prototype.negate=function() { return new Complex(-this.x,-this.y); }
Complex.prototype.toString=function()
		{ if(arguments.length<1) return "("+this.x.toString()+(this.y<0?"-i":"+i")+Math.abs(this.y).toString()+")";
		  else return "("+this.x.toString(arguments[0])+(this.y<0?"-i":"+i")+Math.abs(this.y).toString(arguments[0])+")";										
	   }
Complex.prototype.toFixed=function()
		{ if(arguments.length<1) return "("+this.x.toFixed()+(this.y<0?"-i":"+i")+Math.abs(this.y).toFixed()+")"; 
		  else return "("+this.x.toFixed(arguments[0])+(this.y<0?"-i":"+i")+Math.abs(this.y).toFixed(arguments[0])+")";
		}
Complex.prototype.toExponential=function()
		{ if(arguments.length<1) return "("+this.x.toExponential()+(this.y<0?"-i":"+i")+Math.abs(this.y).toExponential()+")";
		  else return "("+this.x.toExponential(arguments[0])+(this.y<0?"-i":"+i")+Math.abs(this.y).toExponential(Number(arguments[0]))+")";
  		}
Complex.prototype.toPrecision=function()
		{ if(arguments.length<1) return "("+this.x.toPrecision()+(this.y<0?"-i":"+i")+Math.abs(this.y).toPrecision()+")";
		  else return "("+this.x.toPrecision(arguments[0])+(this.y<0?"-i":"+i")+Math.abs(this.y).toPrecision(arguments[0])+")";
		}
Complex.prototype.toStringShort=function() {if(this.y==0)return this.x.toString(); else return "("+this.x+(this.y<0?"-i":"+i")+Math.abs(this.y)+")"; }
Complex.prototype.valueOf=function() { return this.x; }
Complex.prototype.conj=function() { return new Complex(this.x,-this.y); }
Complex.prototype.real=function() { if(arguments.length>=1) this.x=Number(arguments[0]); return this.x; }
Complex.prototype.imag=function() { if(arguments.length>=1) this.y=Number(arguments[0]); return this.y; }
Complex.prototype.arg=function() { return Math.atan2(this.y,this.x); }
Complex.prototype.abs=function() { if(this.x==0&&this.y==0) return 0; if(Math.abs(this.x)>=Math.abs(this.y)) return Math.abs(this.x)*Math.sqrt(1+(this.y/this.x)*(this.y/this.x)); else return Math.abs(this.y)*Math.sqrt(1+(this.x/this.y)*(this.x/this.y));}
// Class Methods
Complex.add=function(a,b) {return new Complex(a.x+b.x,a.y+b.y); }
Complex.sub=function(a,b) {return new Complex(a.x-b.x,a.y-b.y); }
Complex.mul=function(a,b) {return new Complex(a.x*b.x-a.y*b.y,a.y*b.x+a.x*b.y); } 
Complex.div=function(a,b)
		{var r,s; if(b.x==0&&b.y==0) return new Complex(Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY);
		if(Math.abs(b.x)>=Math.abs(b.y)) {r=b.y/b.x; s=b.x+r*b.y; return new Complex((a.x+a.y*r)/s,(a.y-a.x*r)/s);}
		else {r=b.x/b.y; s=b.y+r*b.x; return new Complex((a.x*r+a.y)/s,(a.y*r-a.x)/s);}
		}
Complex.abs=function(a) {if(a instanceof Complex) return a.abs(); else return Math.abs(a);}
Complex.sqrt=function(a)
		{ if(a.x==0&&a.y==0) return new Complex();
		if(a.x>0) {var aux= a.abs()+a.x; return new Complex(Math.sqrt(aux/2),a.y/Math.sqrt(2*aux));}
		else {var aux=a.abs()-a.x; if(a.y<0) return new Complex(Math.abs(a.y)/Math.sqrt(2*aux),-Math.sqrt(aux/2)); else return new Complex(Math.abs(a.y)/Math.sqrt(2*aux),Math.sqrt(aux/2));}
    	}
Complex.equal=function(a,b) { if(a.x==b.x&&a.y==b.y) return true; else return false; }
Complex.polar=function(r,theta) { return new Complex( r*Math.cos(theta),r*Math.sin(theta)); }
// Transcendental functions
Complex.log=function(a) {return new Complex(Math.log(a.abs()),a.arg()); }
Complex.log10=function(a) {return Complex.div(Complex.log(a),new Complex(Math.LN10)); }
Complex.exp=function(a) {return new Complex(Math.exp(a.real())*Math.cos(a.imag()),Math.exp(a.real())*Math.sin(a.imag())); }
Complex.pow=function(a,b) {return Complex.exp(Complex.mul(Complex.log(a),b)); }
// Trigonometric functions
// Add Hyperbolic function for real arguments, to complement the Math Library
if(typeof Math.sinh == "undefined")	{Math.sinh=function(x) {return (Math.exp(x)-Math.exp(-x))*0.5;}}
if(typeof Math.cosh == "undefined") {Math.cosh=function(x) {return (Math.exp(x)+Math.exp(-x))*0.5;}}
if(typeof Math.tanh == "undefined") {Math.tanh=function(x) {return (Math.exp(x)-Math.exp(-x))/(Math.exp(x)+Math.exp(-x));}}
// Add hyperbolic functions for complex arguments
Complex.sinh=function(x) {return new Complex(Math.sinh(x.real())*Math.cos(x.imag()),Math.cosh(x.real())*Math.sin(x.imag())); }
Complex.cosh=function(x) {return new Complex(Math.cosh(x.real())*Math.cos(x.imag()),Math.sinh(x.real())*Math.sin(x.imag())); }
Complex.tanh=function(x) {var s=Math.cosh(2*x.real())+Math.cos(2*x.imag()); return new Complex(Math.sinh(2*x.real())/s,Math.sin(2*x.imag())/s); }
// Add trigonomic functions for complex arguments
Complex.sin=function(x) {return new Complex(Math.sin(x.real())*Math.cosh(x.imag()),Math.cos(x.real())*Math.sinh(x.imag())); }
Complex.cos=function(x) {return new Complex(Math.cos(x.real())*Math.cosh(x.imag()),-Math.sin(x.real())*Math.sinh(x.imag())); }
Complex.tan=function(x) {var s=Math.cos(2*x.real())+Math.cosh(2*x.imag()); return new Complex(Math.sin(2*x.real())/s,Math.sinh(2*x.imag())/s); }
// Add arc trigonomic functions for complex arguments
Complex.asin=function(x){var s=Complex.sqrt(Complex.sub(Complex.one,Complex.mul(x,x))); s=Complex.add(Complex.mul(x,Complex.i),s); s=Complex.log(s); return new Complex.mul(Complex.i.negate(),s); }
Complex.acos=function(x){var s=Complex.sqrt(Complex.sub(Complex.one,Complex.mul(x,x))); s=Complex.add(Complex.mul(x,Complex.i),s); s=Complex.mul(Complex.log(s),Complex.i); return new Complex.add(Complex(Math.PI/2),s); }
Complex.atan=function(x) {var s=Complex.mul(x,Complex.i); var s1=Complex.log(Complex.sub(Complex.one,s)); var s2=Complex.log(Complex.add(s,Complex.one)); s=Complex.sub(s1, s2 ); return new Complex.mul(s, Complex.mul(Complex.i,Complex(0.5))); }
//Add arc hyperbolic functions for complex arguments
Complex.asinh=function(x) {var s=Complex.sqrt(Complex.add(Complex.mul(x,x),Complex.one)); return new Complex.log(Complex.add(x,s)); }
Complex.acosh=function(x) {var s1=Complex.sqrt(Complex.sub(x,Complex.one)); var s2=Complex.sqrt(Complex.add(x,Complex.one)); return new Complex.log(Complex.add(x,Complex.mul(s1,s2))); }
Complex.atanh=function(x) {if(Math.abs(x.real())==1&&x.imag()==0) return new Complex(x.real()*Infinity,0); var s1=Complex.log(Complex.sub(Complex.one,x)); var s2=Complex.log(Complex.add(Complex.one,x)); return new Complex.mul(Complex.sub(s2,s1),Complex(0.5));}
// Add Gamma for real and compolex arguments
if(typeof Math.gamma == "undefined") {Math.gamma=function(n) {return Complex.gamma(n)}}
Complex.gamma=function(z) {try {
		var t,x,i,divisor,result;
		var g=4.7421875; var twoPiSqrt = Math.sqrt(2 * Math.PI);
		var p=[0.99999999999999709182,57.156235665862923517,-59.597960355475491248,14.136097974741747174,-0.49191381609762019978,
  		0.33994649984811888699e-4,0.46523628927048575665e-4,-0.98374475304879564677e-4,0.15808870322491248884e-3,-0.21026444172410488319e-3,
  		0.21743961811521264320e-3,-0.16431810653676389022e-3,0.84418223983852743293e-4,-0.26190838401581408670e-4,0.36899182659531622704e-5];
	   function gamma(n)  // Gamma with real argument
	   {try {var t,x,i;  if(n>=171.35) {return Infinity;} // will overflow
       if(n==Math.round(n)) {if(n<=0) {return isFinite(n)?Infinity:NaN;} for(t=1,i=2;i<=n-1;i++) t*=i; return t;} //alert("in Gamma float"+t);
	   if(n<0.5) {return Math.PI/(Math.sin(Math.PI*n)*gamma(1-n));}
       if(n>85.0){// Extended Stirling Approx
       		var twoN=n*n,threeN=twoN*n,fourN=threeN*n,fiveN=fourN*n;
        	return Math.sqrt(2*Math.PI/n)*Math.pow((n/Math.E),n)*(1+1/(12*n)+1/(288*twoN)-139/(51840*threeN)-571/(2488320*fourN)+163879/(209018880*fiveN)+5246819/(75246796800*fiveN*n));}
	   --n;x=p[0];for(i=1;i<p.length;++i) {x+=p[i]/(n + i);}t=n+g+0.5;
	   return Math.sqrt(2 * Math.PI) * Math.pow(t,n+0.5)*Math.exp(-t)*x;
	   } catch(e){ alert("Ops. something went wrong while executing gamma(Number): "+e.name+" "+e.message);}
	   }
	  if(z instanceof Complex&&z.imag()==0) {z=z.real();}   // Reduce argument to float if possible
	  if((z instanceof Complex)==false) return gamma(z);  // Call gamma for float argument
	  // Complex argument
      z=new Complex(z.real()-1,z.imag());x=new Complex(p[0],0);
      for(i=1;i<p.length;++i) {divisor=Complex(z.real()+i,z.imag()); x=Complex.add(x,Complex.div(Complex(p[i]),divisor)); if(Complex.equal(divisor,Complex.zero)&&p[i]<0) {x.negate(); alert("Divisor zero "+divisor.toString());} }
      t=new Complex(z.real()+g+0.5,z.imag());
      z.real(z.real()+0.5);
      result=Complex.pow(t,z); result.real(result.real()*twoPiSqrt); result.imag(result.imag()*twoPiSqrt);
      t=Complex.exp(t.negate());
	  result=Complex.mul(result,t);//alert("result2="+result.toString()+" t="+t.toString()+" x="+x.toString());
      result=Complex.mul(result,x);//alert("result3="+result.toString()+" t="+t.toString()+" x="+x.toString());
	  if(isFinite(result.real())==false) result.real(Number.POSITIVE_INFINITY);
	  if(isFinite(result.imag())==false) result.imag(Number.POSITIVE_INFINITY);
	  return result;
	} catch(e){ alert("Ops. something went wrong while executing gamma(Complex): "+e.name+" "+e.message);}
    }
if(typeof Math.lgamma == "undefined") {Math.lgamma=function(n) {return Complex.lgamma(n).real()}}
Complex.lgamma=function(z) {try {
		var t,r,x,i,divisor,result;
		var g=4.7421875; var twoPiSqrt = Math.sqrt(2 * Math.PI);
		var p=[0.99999999999999709182,57.156235665862923517,-59.597960355475491248,14.136097974741747174,-0.49191381609762019978,
  		0.33994649984811888699e-4,0.46523628927048575665e-4,-0.98374475304879564677e-4,0.15808870322491248884e-3,-0.21026444172410488319e-3,
  		0.21743961811521264320e-3,-0.16431810653676389022e-3,0.84418223983852743293e-4,-0.26190838401581408670e-4,0.36899182659531622704e-5];
	   function lgamma(n)  // Gamma with real argument
	   {try {var t,x,i; 
       if(n==Math.round(n)) {if(n<=0) {return isFinite(n)?Infinity:NaN;} for(t=0,i=2;i<=n-1;i++) t+=Math.log(i); return t;}  //alert("in Gamma float"+t);
	   if(n<0.5) {return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*n))-lgamma(1-n);}
       if(n>85.0){// Extended Stirling Approx
       		var twoN=n*n,threeN=twoN*n,fourN=threeN*n,fiveN=fourN*n;
			return Math.log(Math.sqrt(2*Math.PI/n))+n*Math.log(n/Math.E)+Math.log(1+1/(12*n)+1/(288*twoN)-139/(51840*threeN)-571/(2488320*fourN)+163879/(209018880*fiveN)+5246819/(75246796800*fiveN*n));
		}
	   for(x=p[0],i=1;i<p.length;++i) {x+=p[i]/(n+i);}
	   t=n+g+0.5; t=(n+0.5)*Math.log(t)-t;
	   return t+Math.log(Math.sqrt(2*Math.PI)*x/n);
	   } catch(e){ alert("Ops. something went wrong while executing gamma(Number): "+e.name+" "+e.message);}
	   }
	   
	  if(z instanceof Complex&&z.imag()==0) z=z.real();   // Reduce argument to float if possible
	  if((z instanceof Complex)==false) return Complex(lgamma(z));  // Call gamma for float arguments
	  // Complex argument
      z=new Complex(z.real()-1,z.imag());x=new Complex(p[0]); 
      for(i=1;i<p.length;++i) {divisor=Complex(z.real()+i,z.imag()); x=Complex.add(x,Complex.div(Complex(p[i]),divisor)); if(Complex.equal(divisor,Complex.zero)&&p[i]<0) {x.negate(); alert("Divisor zero "+divisor.toString());} }
      t=new Complex(z.real()+g+0.5,z.imag()); z.real(z.real()+0.5);
	  result=Complex.mul(z,Complex.log(t)); result=Complex.add(result,Complex.log(Complex(twoPiSqrt)));
	  t=Complex.exp(t.negate());
      result=Complex.add(Complex.add(Complex(result),Complex.log(t)),Complex.log(x));
	  return result;
	} catch(e){ alert("Ops. something went wrong while executing gamma(Complex): "+e.name+" "+e.message);}
    }
if(typeof Math.beta=="undefined") {Math.beta=function(a,b) {return Complex.beta(Complex(a),Complex(b));}}
Complex.beta=function(z,w) {return Complex.exp(Complex.sub(Complex.add(Complex.lgamma(z),Complex.lgamma(w)),Complex.lgamma(Complex.add(z,w))));}
if(typeof Math.erf=="undefined")
{Math.erf=function(a) {if(a<0) return -Complex.erf(Complex(-a)).real(); else return Complex.erf(Complex(a)).real();}}
Complex.erf=function(z) {var a=[0.3275911,0.254829592,-0.284496736,1.421413741,-1.453152027,1.061405429]; var sum,i,t=Complex.div(Complex(1),Complex.add(Complex(1),Complex.mul(Complex(a[0]),z)));
	var ta=[]; for(i=2,ta[1]=t;i<=5;++i) ta[i]=Complex.mul(ta[i-1],t); for(i=1;i<=5;++i) ta[i]=Complex.mul(ta[i],Complex(a[i])); for(i=1,sum=Complex(0);i<=5;++i) sum=Complex.add(sum,ta[i]);
	sum=Complex.mul(sum,Complex.exp(Complex.mul(z,z).negate())); sum=Complex.sub(Complex(1),sum);
	return sum;
	}
// Miscellaneous parseComplex() function in it's various format: (float [+-]i float) or (float) or ([+-]i float)
// It also allows input without paranthese e.g. float [+-]i float, float, [+-]i float
function parseComplex(s)
	{var split_re=/^[\(]?([+-eE\.\d]*)([+-][iI]?[eE+-\.\d]+[iI]?)?[\)]?$/;
	s=s.replace(/[\s]+/g,"");  // Remove all white spaces
	if(split_re.test(s)==true) // Can it be split into real and imaginary float numbers?
		{var rs, is, real, imag;
		rs=RegExp.$1; is=RegExp.$2; //alert("ParseComplex:"+rs+" "+is);
		if(rs=="") real=0; else real=parseFloat(rs);
		if(is!="") is=is.replace(/[iI]/,""); // Remove the [iI]  
		if(is=="") imag=0; else imag=parseFloat(is);
		//alert("R="+rs+" I="+is+" ("+real+","+imag+")");
		return new Complex(real,imag);
		}
	else
		return new Complex(NaN,NaN);
	}