import { XMLParser } from "fast-xml-parser";
import { COMMON_HTML, CURRENCY, EntityDecoderImpl, XML } from "./xml-external/nodable_entities";
const entityDecoder = new EntityDecoderImpl({
    namedEntities: { ...XML, ...COMMON_HTML, ...CURRENCY },
    numericAllowed: true,
    limit: {
        maxTotalExpansions: Infinity,
    },
    ncr: {
        xmlVersion: 1.1,
    },
});
const parser = new XMLParser({
    attributeNamePrefix: "",
    processEntities: {
        enabled: true,
        maxTotalExpansions: Infinity,
    },
    htmlEntities: true,
    entityDecoder: {
        setExternalEntities: (entities) => {
            entityDecoder.setExternalEntities(entities);
        },
        addInputEntities: (entities) => {
            entityDecoder.addInputEntities(entities);
        },
        reset: () => {
            entityDecoder.reset();
        },
        decode: (text) => {
            return entityDecoder.decode(text);
        },
        setXmlVersion: (version) => void {},
    },
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseTagValue: false,
    trimValues: false,
    tagValueProcessor: (_, val) => (val.trim() === "" && val.includes("\n") ? "" : undefined),
    maxNestedTags: Infinity,
});
export function parseXML(xmlString) {
    return parser.parse(xmlString, true);
}
