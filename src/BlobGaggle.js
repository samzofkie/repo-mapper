import { Circle } from './Circle';

export class BlobGaggle {
  constructor(tree) {
    this.blobs = tree.entries.filter(entry => entry.type === 'blob');
  }

  getCopyOfBlobs() {
    return [...this.blobs.map(blob => structuredClone(blob))];
  }

  scaleBlobs(scalar) {
    const blobs = this.getCopyOfBlobs();
    return blobs.map(blob => ({
      ...blob,
      size: scalar * Math.sqrt(blob.bytes),
    }));
  }

  // Returns a tuple: (
  //   - scalar
  //   - array of ints, where each entry specifies how many blobs should be
  //     packed into that row (one int per row)
  // )
  calculateScalarAndRows(diameter) {
    let precision = 5;
    let scalar=0, blobs, solution;
    for (let i=0; i<precision; i++) {
      let inc = 10**-i;
      blobs = this.scaleBlobs(scalar + inc);
      solution = Circle.packIntoRows(diameter, blobs.map(blob => blob.size));
      while(solution !== null) {
        scalar += inc;
        blobs = this.scaleBlobs(scalar + inc);
        solution = Circle.packIntoRows(diameter, blobs.map(blob => blob.size));
      }
    }
    blobs = this.scaleBlobs(scalar);
    solution = Circle.packIntoRows(diameter, blobs.map(blob => blob.size));

    return [
      scalar, 
      solution.map(sizes => sizes.length),
    ];
  }
}