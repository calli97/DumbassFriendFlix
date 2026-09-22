import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

/**
 * Parses an optional integer query/route param.
 * Missing values come through as NaN because the global ValidationPipe
 * (transform: true) runs `+undefined` for `number` params, so NaN, null,
 * undefined and '' are all treated as "not provided".
 */
@Injectable()
export class OptionalIntPipe implements PipeTransform<unknown, number | undefined> {
  transform(value: unknown, metadata: ArgumentMetadata): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value === "number" && Number.isNaN(value)) return undefined;

    const str = String(value);
    if (!/^-?\d+$/.test(str)) {
      throw new BadRequestException(`${metadata.data ?? "value"} must be an integer`);
    }
    return parseInt(str, 10);
  }
}
