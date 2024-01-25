/*
 * Copyright (c) 2023 Denise Becker, Robin Hoffmann
 * All rights reserved.
 */
export class CompareIt
{
	static EPS = 1.0E-10;

	// Compare two double taking into account the double precision potential error.
	// Take care: truncation errors accumulate on calculation. More you do, more you should increase the epsilon.
	static aboutEquals(value1, value2)
	{
		if (Number.POSITIVE_INFINITY === value1) return Number.POSITIVE_INFINITY === value2;
		if (Number.NEGATIVE_INFINITY === value1) return Number.NEGATIVE_INFINITY === value2;

		if (Number.isNaN(value1)) return Number.isNaN(value2);

		// Math.abs(value1 - value2) <= CompareIt.EPS
		// would be the absolute comparison but it is better and more reliable to prefer the relative comparision
		// which works also for very large and small values

		let epsilon = Math.max(1.0, Math.max(Math.abs(value1), Math.abs(value2))) * CompareIt.EPS;
		let val = Math.abs(value1 - value2);
		return val <= epsilon;
	}
	
	static pointsAboutEqual(p1, p2)
	{
		return CompareIt.aboutEquals(p1.x, p2.x) && CompareIt.aboutEquals(p1.y, p2.y); // L-infinity Norm
	}	

	static calcEps()
	{ // Lowest positive number where (1.0 + eps <> 1.0) [= 2^-53 or about 10^-15]
		let eps = 1.0;
		do
		{
			eps /= 2.0;
		}
		while (1.0 + eps !== 1.0);

		return 2.0 * eps;
	}
}