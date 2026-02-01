function mergeEntities(routeResults) {
  const entities = {};

  for (const route of routeResults) {
    for (const entity of route.entities || []) {
      const name = entity.name;
      if (!entities[name]) {
        entities[name] = {
          fields: [],
          sources: [],
          referencedBy: []
        };
      }

      // Merge fields (dedupe)
      for (const field of entity.fields || []) {
        if (!entities[name].fields.includes(field)) {
          entities[name].fields.push(field);
        }
      }

      // Merge sources (dedupe)
      if (entity.source && !entities[name].sources.includes(entity.source)) {
        entities[name].sources.push(entity.source);
      }

      // Add reference
      if (!entities[name].referencedBy.includes(route.capabilityName)) {
        entities[name].referencedBy.push(route.capabilityName);
      }
    }
  }

  return entities;
}

function normalizeEntityName(name) {
  if (!name) return '';
  return name
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '');
}

function buildRouteAnalysisResult({
  routeFile,
  capabilityName,
  method,
  path,
  llmResult
}) {
  const normalizedEntities = (llmResult.entities || []).map((entity) => ({
    name: normalizeEntityName(entity.name),
    fields: entity.fields || [],
    source: entity.source || 'inferred'
  }));

  return {
    routeFile,
    capabilityName,
    method,
    path,
    description: llmResult.description,
    entities: normalizedEntities,
    analysisSource: llmResult.fallback ? 'heuristic' : 'llm'
  };
}

module.exports = {
  mergeEntities,
  normalizeEntityName,
  buildRouteAnalysisResult
};
