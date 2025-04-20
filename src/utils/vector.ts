import { Vector } from "excalibur";

export function reflectVector(vector: Vector, normal: Vector): Vector {
  const unitNormal = normal.normalize();
  const dotProduct = vector.dot(unitNormal);
  return vector.sub(unitNormal.scale(2 * dotProduct));
}