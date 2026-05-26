"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXML = parseXML;
const fast_xml_parser_1 = require("fast-xml-parser");
const nodable_entities_1 = require("./xml-external/nodable_entities");
const entityDecoder = new nodable_entities_1.EntityDecoderImpl({
    namedEntities: { ...nodable_entities_1.XML, ...nodable_entities_1.COMMON_HTML, ...nodable_entities_1.CURRENCY },
    numericAllowed: true,
    limit: {
        maxTotalExpansions: Infinity,
    },
    ncr: {
        xmlVersion: 1.1,
    },
});
const parser = new fast_xml_parser_1.XMLParser({
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
function parseXML(xmlString) {
    return parser.parse(xmlString, true);
}
