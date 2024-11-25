import { Circle } from './Circle';

export class BlobGaggle {
  static MAX_SIZE = 200;
  static MIN_SIZE = 10;

  constructor(tree) {
    this.blobs = tree.entries.filter(entry => entry.type === 'blob');
  }

  getCopyOfBlobs() {
    return [...this.blobs.map(blob => structuredClone(blob))];
  }

  scaleBlobs(scalar) {
    const blobs = this.getCopyOfBlobs();
    const scale = blob => {
      let size = scalar * Math.sqrt(blob.bytes);
      size = Math.min(size, BlobGaggle.MAX_SIZE);
      size = Math.max(size, BlobGaggle.MIN_SIZE);
      return size;
    };
    return blobs.map(blob => ({
      ...blob,
      size: scale(blob),
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

    for (let i=-100; i<precision; i++) {
      let inc = 10**-i;
      blobs = this.scaleBlobs(scalar + inc);
      solution = Circle.packIntoRows(diameter, blobs.map(blob => blob.size));
      let iters = 0, MAX_ITERS = 10;
      while(solution !== null) {
        scalar += inc;
        blobs = this.scaleBlobs(scalar + inc);
        solution = Circle.packIntoRows(diameter, blobs.map(blob => blob.size));
        if (++iters > MAX_ITERS) {
          console.error('BlobGaggle.calculateScalarAndRows() hit MAX_ITERS!');
          break;
        }
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