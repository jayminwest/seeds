import { z as zv4 } from 'zod/v4';
import { zodToJsonSchema } from "zod-to-json-schema";
/**
 * Recursively makes a JSON schema strict-mode compatible:
 * - Sets additionalProperties: false on all objects
 * - Makes optional properties required with nullable type
 * Mirrors Python SDK's rec_strict_json_schema + optional handling.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- operating on raw JSON schema objects
function makeStrictJsonSchema(node) {
    if (typeof node !== 'object' || node === null)
        return node;
    const result = { ...node };
    if (result.type === 'object' && result.properties && typeof result.properties === 'object') {
        const required = new Set(Array.isArray(result.required) ? result.required : []);
        const props = {};
        for (const [key, value] of Object.entries(result.properties)) {
            const processed = makeStrictJsonSchema(value);
            if (!required.has(key)) {
                required.add(key);
                if (Array.isArray(processed.type)) {
                    if (!processed.type.includes('null'))
                        props[key] = { ...processed, type: [...processed.type, 'null'] };
                    else
                        props[key] = processed;
                }
                else if (Array.isArray(processed.anyOf)) {
                    if (!processed.anyOf.some((s) => s.type === 'null'))
                        props[key] = { ...processed, anyOf: [...processed.anyOf, { type: 'null' }] };
                    else
                        props[key] = processed;
                }
                else if (processed.type) {
                    props[key] = { ...processed, type: [processed.type, 'null'] };
                }
                else {
                    props[key] = processed;
                }
            }
            else {
                props[key] = processed;
            }
        }
        result.properties = props;
        result.required = [...required];
        result.additionalProperties = false;
    }
    if (result.items)
        result.items = makeStrictJsonSchema(result.items);
    for (const key of ['anyOf', 'oneOf', 'allOf']) {
        if (Array.isArray(result[key]))
            result[key] = result[key].map(makeStrictJsonSchema);
    }
    for (const key of ['$defs', 'definitions']) {
        if (result[key] && typeof result[key] === 'object') {
            const defs = {};
            for (const [k, v] of Object.entries(result[key]))
                defs[k] = makeStrictJsonSchema(v);
            result[key] = defs;
        }
    }
    return result;
}
function toJsonSchema(schema) {
    let jsonSchema;
    // Detect Zod v4 schemas by checking for _zod property (v3 schemas have _def only)
    if ('_zod' in schema) {
        jsonSchema = zv4.toJSONSchema(schema);
    }
    else {
        jsonSchema = zodToJsonSchema(schema, { target: "openAi" });
    }
    delete jsonSchema['$schema'];
    return makeStrictJsonSchema(jsonSchema);
}
export function transformToChatCompletionRequest(parsedRequest) {
    const { responseFormat, ...rest } = parsedRequest;
    // Transform responseFormat from z.ZodType to ResponseFormat
    const transformedResponseFormat = responseFormatFromZodObject(responseFormat);
    return {
        ...rest,
        ...(transformedResponseFormat ? { responseFormat: transformedResponseFormat } : {}),
    };
}
export function convertToParsedChatCompletionResponse(response, responseFormat) {
    if (response.choices === undefined || response.choices.length === 0) {
        return {
            ...response,
            choices: response.choices === undefined ? undefined : [],
        };
    }
    const parsedChoices = [];
    for (const _choice of response.choices) {
        if (_choice.message === null || typeof _choice.message === 'undefined') {
            parsedChoices.push({ ..._choice, message: undefined });
        }
        else {
            if (_choice.message.content !== null && typeof _choice.message.content !== 'undefined' && !Array.isArray(_choice.message.content)) {
                parsedChoices.push({
                    ..._choice,
                    message: {
                        ..._choice.message,
                        parsed: responseFormat.safeParse(JSON.parse(_choice.message.content)).data,
                    }
                });
            }
        }
    }
    return {
        ...response,
        choices: parsedChoices,
    };
}
// Function to convert Zod schema to strict JSON schema
export function responseFormatFromZodObject(responseFormat) {
    const responseJsonSchema = toJsonSchema(responseFormat);
    // It is not possible to get the variable name of a Zod object at runtime in TypeScript so we're using a placeholder name.
    // This has not impact on the parsing as the initial Zod object is used to parse the response.
    const placeholderName = "placeholderName";
    return {
        type: "json_schema",
        jsonSchema: {
            name: placeholderName,
            schemaDefinition: responseJsonSchema,
            strict: true,
        },
    };
}
//# sourceMappingURL=structChat.js.map