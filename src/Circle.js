export class Circle {
  // https://stackoverflow.com/a/64414875/13387094
  // Get all *combinations* of length k using distinct members of arr, for
  // example:
  //   choose([1,2,3], 2)) => [[1,2], [1,3], [1,4]]
  /*static choose(arr, k, prefix=[]) {
    if (k == 0) return [prefix];
    return arr.flatMap((v, i) =>
        Circle.choose(arr.slice(i+1), k-1, [...prefix, v])
    );
  }*/

  // Calculates the height and width of a row of the circles of the sizes 
  // specified by the sizes array param all concatenated
  static calculateDimensionsOfRowOfCircles(sizes) {
    return {
      width: sizes.reduce((acc, curr) => acc + curr, 0),
      height: Math.max(...sizes),
    }
  }

  // Creates a matrix where matrix[i][j] is an object containing the dimensions
  // of a row of concatenated circles from sizes[i] to sizes[j]
  static createRowDimensionsMatrix(sizes) {
    const rowSizesMatrix = [];
    for (let i=0; i<sizes.length; i++) {
      const row = [];
      for (let j=1; j<=sizes.length; j++) {
        if (j <= i) {
          row.push(null);
        } else {
          const dimensions = Circle.calculateDimensionsOfRowOfCircles(sizes.slice(i, j));
          row.push(dimensions);
        }
      }
      rowSizesMatrix.push(row)
    }
    return rowSizesMatrix;
  }

  // Works for offset < radius and offset > radius 
  static widthAtOffset(diameter, offset) {
    const radius = diameter / 2;
    return 2 * Math.sqrt(radius**2 - (radius - offset)**2);
  }

  // willRowFitStartingAtOffset takes the diameter of the circumscribing 
  // circle, an offset (`start`, measured in pixels) from the top of the 
  // circle, and returns true or false, depending on whether or not the row
  // described by `rowDim` will fit into the circle at that offset.
  static willRowFitStartingAtOffset(diameter, offset, rowDim) {
    if (rowDim === undefined)
      throw new Error(`Circle.willRowFitStartingAtOffset() was passed undefined for paramter rowDim!`);
    if (
      offset > diameter || 
      offset < 0 || 
      rowDim.height > diameter || 
      rowDim.width > diameter
    )
      return false;

    const circleWidthAtStartOffset = Circle.widthAtOffset(diameter, offset);
    const circleWidthAtEndOffset = 
      Circle.widthAtOffset(diameter, offset + rowDim.height);
    const maxWidth = Math.min(
      circleWidthAtStartOffset, circleWidthAtEndOffset
    );
    return rowDim.width <= maxWidth;
  }

  // Given an array of circle sizes `sizes` and the diameter of a 
  // circumscribing circle, how many ways can we arrange the circles (in order)
  // into rows such that they all fit into the larger circle?
  // If so, it returns an array of arrays, where each array represents a row in
  // the final circle, and the row entries specify the sizes of the circles
  // that go into that row. If it can't pack them, it returns null.
  static packIntoRows(diameter, sizes) {
    if (sizes[0] > diameter)
      return null;

    const rowDimensionsMatrix = Circle.createRowDimensionsMatrix(sizes);

    let solution = [[sizes[0]]];
    let sizeIndex = 1;
    while (sizeIndex < sizes.length) {
      const offset = solution
        .map(row => Math.max(...row))
        .reduce((acc, curr) => acc + curr, 0);
      //console.log(`offset is ${offset}`);
      
      // If the next size won't fit into the next row by itself, we can't pack
      if (
        !(Circle.willRowFitStartingAtOffset(
          diameter, offset, rowDimensionsMatrix[sizeIndex][sizeIndex]
        ))
      ) {
        //console.log(`${sizes[sizeIndex]} by itself wont fit; terminating`);
        return null;
      }

      // Otherwise, start a new row with sizes[sizeIndex]
      const newRow = [sizes[sizeIndex]];
      //console.log(`created new row`, newRow);

      let start = sizeIndex;
      //console.log(`going into while loop, start:${start}, sizeIndex+1:${sizeIndex+1}, rowDimensionsMatrix[...] is `,rowDimensionsMatrix[start][sizeIndex+1]);
      while (
        sizeIndex + 1 < sizes.length &&
        Circle.willRowFitStartingAtOffset(
          diameter, offset, rowDimensionsMatrix[start][sizeIndex+1]
        )
      ) {
        //console.log(...sizes.slice(start, sizeIndex+2), 'will fit into this row');
        sizeIndex++;
        newRow.push(sizes[sizeIndex]);
        //console.log('new row is now', ...newRow);
      }

      solution.push(newRow);
      sizeIndex++;
    }

    //console.log(solution);
    return solution;
  } 
}