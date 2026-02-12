const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  buildSystemPrompt,
  loadDSLSchema,
  loadDSLExamples,
  formatCapabilityContext,
  formatExamples
} = require('../lib/prompt-builder');

// --- loadDSLSchema ---

describe('loadDSLSchema', () => {
  it('loads and parses the DSL schema', () => {
    const schema = loadDSLSchema();
    assert.equal(schema.title, 'n.codes UI Generation DSL');
    assert.ok(schema.definitions);
    assert.ok(schema.definitions.page);
    assert.ok(schema.definitions['data-table']);
  });
});

// --- loadDSLExamples ---

describe('loadDSLExamples', () => {
  it('loads all example files', () => {
    const examples = loadDSLExamples();
    assert.ok(examples.length >= 6, `Expected >= 6 examples, got ${examples.length}`);
  });

  it('each example has name and dsl properties', () => {
    const examples = loadDSLExamples();
    for (const ex of examples) {
      assert.ok(typeof ex.name === 'string');
      assert.ok(typeof ex.dsl === 'object');
      assert.equal(ex.dsl.type, 'page');
    }
  });

  it('includes the task-list example', () => {
    const examples = loadDSLExamples();
    const taskList = examples.find(e => e.name === 'task-list');
    assert.ok(taskList);
    assert.equal(taskList.dsl.title, 'All Tasks');
  });
});

// --- formatCapabilityContext ---

describe('formatCapabilityContext', () => {
  it('returns empty string for null', () => {
    assert.equal(formatCapabilityContext(null), '');
  });

  it('returns empty string for undefined', () => {
    assert.equal(formatCapabilityContext(undefined), '');
  });

  it('includes project name', () => {
    const result = formatCapabilityContext({ project: 'My App' });
    assert.ok(result.includes('Application: My App'));
  });

  it('formats actions with endpoint and description', () => {
    const cap = {
      actions: {
        createTask: { endpoint: 'POST /tasks', description: 'Create a new task' },
        deleteTask: { endpoint: 'DELETE /tasks/:id', description: 'Delete a task' }
      }
    };
    const result = formatCapabilityContext(cap);
    assert.ok(result.includes('POST /tasks'));
    assert.ok(result.includes('DELETE /tasks/:id'));
    assert.ok(result.includes('Create a new task'));
  });

  it('formats queries with endpoint and description', () => {
    const cap = {
      queries: {
        listTasks: { endpoint: 'GET /tasks', description: 'List all tasks' },
        getTask: { endpoint: 'GET /tasks/:id', description: 'Get a single task' }
      }
    };
    const result = formatCapabilityContext(cap);
    assert.ok(result.includes('GET /tasks'));
    assert.ok(result.includes('GET /tasks/:id'));
    assert.ok(result.includes('List all tasks'));
  });

  it('uses action name as fallback when endpoint missing', () => {
    const cap = { actions: { createTask: { description: 'Create' } } };
    const result = formatCapabilityContext(cap);
    assert.ok(result.includes('createTask'));
  });

  it('merges actions and queries into single routes section', () => {
    const cap = {
      actions: { createTask: { endpoint: 'POST /tasks', description: 'Create' } },
      queries: { listTasks: { endpoint: 'GET /tasks', description: 'List' } }
    };
    const result = formatCapabilityContext(cap);
    assert.ok(result.includes('Available API Routes:'));
    assert.ok(result.includes('POST /tasks'));
    assert.ok(result.includes('GET /tasks'));
  });

  it('formats entities as object map with fields', () => {
    const cap = {
      entities: {
        task: { fields: ['id', 'title', 'status'], description: 'A task' },
        user: { fields: ['id', 'name', 'email'], description: 'A user' }
      }
    };
    const result = formatCapabilityContext(cap);
    assert.ok(result.includes('task: id, title, status'));
    assert.ok(result.includes('user: id, name, email'));
  });

  it('handles entities with no fields', () => {
    const cap = { entities: { item: { description: 'An item' } } };
    const result = formatCapabilityContext(cap);
    assert.ok(result.includes('item: unknown'));
  });

  it('handles empty actions/queries/entities gracefully', () => {
    const cap = { project: 'Empty App', actions: {}, queries: {}, entities: {} };
    const result = formatCapabilityContext(cap);
    assert.ok(result.includes('Application: Empty App'));
    assert.ok(!result.includes('Available API Routes:'));
    assert.ok(!result.includes('Known Entities:'));
  });
});

// --- formatExamples ---

describe('formatExamples', () => {
  it('formats examples with names and JSON', () => {
    const examples = [
      { name: 'task-list', dsl: { type: 'page', title: 'Tasks', children: [] } }
    ];
    const result = formatExamples(examples);
    assert.ok(result.includes('### Example: task list'));
    assert.ok(result.includes('"type": "page"'));
  });

  it('replaces hyphens with spaces in names', () => {
    const examples = [
      { name: 'create-task-form', dsl: { type: 'page', title: 'T', children: [] } }
    ];
    const result = formatExamples(examples);
    assert.ok(result.includes('Example: create task form'));
  });

  it('includes JSON code blocks', () => {
    const examples = [
      { name: 'test', dsl: { type: 'page', title: 'T', children: [] } }
    ];
    const result = formatExamples(examples);
    assert.ok(result.includes('```json'));
    assert.ok(result.includes('```'));
  });
});

// --- buildSystemPrompt ---

describe('buildSystemPrompt', () => {
  it('builds a prompt containing the DSL schema', () => {
    const prompt = buildSystemPrompt(null);
    assert.ok(prompt.includes('DSL Schema'));
    assert.ok(prompt.includes('data-table'));
    assert.ok(prompt.includes('detail-view'));
    assert.ok(prompt.includes('form'));
  });

  it('includes component types reference', () => {
    const prompt = buildSystemPrompt(null);
    assert.ok(prompt.includes('Component Types Reference'));
    assert.ok(prompt.includes('summary-cards'));
    assert.ok(prompt.includes('empty-state'));
  });

  it('includes rules section', () => {
    const prompt = buildSystemPrompt(null);
    assert.ok(prompt.includes('Rules'));
    assert.ok(prompt.includes('ALWAYS output a root "page" component'));
  });

  it('includes examples from shared/dsl-examples/', () => {
    const prompt = buildSystemPrompt(null);
    assert.ok(prompt.includes('Examples'));
    assert.ok(prompt.includes('task list'));
    assert.ok(prompt.includes('dashboard'));
  });

  it('includes capability map context when provided', () => {
    const cap = {
      project: 'TaskApp',
      queries: { listTasks: { endpoint: 'GET /tasks', description: 'List tasks' } },
      entities: { task: { fields: ['id', 'title'], description: 'A task' } }
    };
    const prompt = buildSystemPrompt(cap);
    assert.ok(prompt.includes('Application Context'));
    assert.ok(prompt.includes('TaskApp'));
    assert.ok(prompt.includes('GET /tasks'));
    assert.ok(prompt.includes('task: id, title'));
  });

  it('omits Application Context section when capabilityMap is null', () => {
    const prompt = buildSystemPrompt(null);
    assert.ok(!prompt.includes('Application Context'));
  });

  it('accepts custom schema and examples via options', () => {
    const customSchema = { title: 'Custom Schema' };
    const customExamples = [
      { name: 'custom', dsl: { type: 'page', title: 'Custom', children: [] } }
    ];
    const prompt = buildSystemPrompt(null, {
      dslSchema: customSchema,
      examples: customExamples
    });
    assert.ok(prompt.includes('Custom Schema'));
    assert.ok(prompt.includes('Example: custom'));
  });
});

// --- Prompt → Expected DSL Type Mapping Test Suite ---
// These test that the prompt instructions correctly guide component type selection.
// We verify the system prompt contains enough guidance for each mapping.

describe('prompt → expected DSL type mappings (20+ pairs)', () => {
  const prompt = buildSystemPrompt({
    project: 'Task Manager',
    actions: {
      createTask: { endpoint: 'POST /tasks', description: 'Create a new task' },
      updateTask: { endpoint: 'PUT /tasks/:id', description: 'Update task' },
      deleteTask: { endpoint: 'DELETE /tasks/:id', description: 'Delete task' }
    },
    queries: {
      listTasks: { endpoint: 'GET /tasks', description: 'List all tasks' },
      getTask: { endpoint: 'GET /tasks/:id', description: 'Get task by ID' }
    },
    entities: {
      task: { fields: ['id', 'title', 'status', 'assignee', 'dueDate'], description: 'A task' },
      user: { fields: ['id', 'name', 'email'], description: 'A user' }
    }
  });

  // --- data-table prompts ---
  it('1. "show all tasks" → guidance for data-table', () => {
    assert.ok(prompt.includes('Listing/browsing'));
    assert.ok(prompt.includes('data-table'));
  });

  it('2. "list users" → data-table columns/rows in schema', () => {
    assert.ok(prompt.includes('"columns"'));
    assert.ok(prompt.includes('"rows"'));
  });

  it('3. "display task list with status" → badge type available', () => {
    assert.ok(prompt.includes('"badge"'));
  });

  it('4. "search results for tasks" → data-table example available', () => {
    assert.ok(prompt.includes('task list'));
  });

  // --- detail-view prompts ---
  it('5. "show task details" → guidance for detail-view', () => {
    assert.ok(prompt.includes('Single record'));
    assert.ok(prompt.includes('detail-view'));
  });

  it('6. "task #2 information" → detail-view fields in schema', () => {
    assert.ok(prompt.includes('"fields"'));
    assert.ok(prompt.includes('"key"'));
    assert.ok(prompt.includes('"value"'));
  });

  it('7. "user profile view" → detail-view example in prompt', () => {
    assert.ok(prompt.includes('task detail'));
  });

  // --- form prompts ---
  it('8. "create a new task" → guidance for form', () => {
    assert.ok(prompt.includes('Creating/editing'));
    assert.ok(prompt.includes('form'));
  });

  it('9. "edit task form" → form submitLabel in schema', () => {
    assert.ok(prompt.includes('"submitLabel"'));
  });

  it('10. "add user registration" → form field types available', () => {
    assert.ok(prompt.includes('"text"'));
    assert.ok(prompt.includes('"email"'));
    assert.ok(prompt.includes('"select"'));
    assert.ok(prompt.includes('"textarea"'));
  });

  it('11. "task creation with status dropdown" → select options rule', () => {
    assert.ok(prompt.includes('select'));
    assert.ok(prompt.includes('options'));
  });

  it('12. "create task form" → form example in prompt', () => {
    assert.ok(prompt.includes('create task form'));
  });

  // --- summary-cards prompts ---
  it('13. "task dashboard overview" → guidance for summary-cards', () => {
    assert.ok(prompt.includes('Overview/metrics'));
    assert.ok(prompt.includes('summary-cards'));
  });

  it('14. "key metrics" → cards with trend in schema', () => {
    assert.ok(prompt.includes('"trend"'));
    assert.ok(prompt.includes('"change"'));
  });

  it('15. "dashboard" → dashboard example in prompt', () => {
    assert.ok(prompt.includes('dashboard'));
  });

  // --- chart prompts ---
  it('16. "tasks by status chart" → chart types in schema', () => {
    assert.ok(prompt.includes('"chartType"'));
    assert.ok(prompt.includes('"bar"'));
    assert.ok(prompt.includes('"line"'));
    assert.ok(prompt.includes('"pie"'));
  });

  it('17. "completion trend over time" → chart datasets/labels', () => {
    assert.ok(prompt.includes('"datasets"'));
    assert.ok(prompt.includes('"labels"'));
  });

  // --- empty-state prompts ---
  it('18. "no tasks found" → guidance for empty-state', () => {
    assert.ok(prompt.includes('No results'));
    assert.ok(prompt.includes('empty-state'));
  });

  it('19. "empty search results" → empty-state example in prompt', () => {
    assert.ok(prompt.includes('empty search'));
  });

  it('20. "no data yet" → empty-state action in schema', () => {
    assert.ok(prompt.includes('"action"'));
    assert.ok(prompt.includes('"icon"'));
  });

  // --- error prompts ---
  it('21. "task not found error" → guidance for error', () => {
    assert.ok(prompt.includes('Errors'));
    assert.ok(prompt.includes('error'));
  });

  it('22. "error page" → error example in prompt', () => {
    assert.ok(prompt.includes('error not found'));
  });

  it('23. "permission denied error" → error retry/code in schema', () => {
    assert.ok(prompt.includes('"code"'));
    assert.ok(prompt.includes('"retry"'));
  });

  // --- list prompts ---
  it('24. "related items list" → list component in schema', () => {
    assert.ok(prompt.includes('"items"'));
    assert.ok(prompt.includes('"ordered"'));
  });

  // --- text prompts ---
  it('25. "show description text" → text component variants', () => {
    assert.ok(prompt.includes('"variant"'));
    assert.ok(prompt.includes('"heading"'));
    assert.ok(prompt.includes('"paragraph"'));
    assert.ok(prompt.includes('"caption"'));
    assert.ok(prompt.includes('"code"'));
  });

  // --- multi-component / composite prompts ---
  it('26. "dashboard with metrics and table" → guidance for multiple children', () => {
    assert.ok(prompt.includes('MULTIPLE child components'));
  });

  // --- capability map integration ---
  it('27. includes the Task Manager project name from capability map', () => {
    assert.ok(prompt.includes('Task Manager'));
  });

  it('28. includes API endpoints from actions and queries', () => {
    assert.ok(prompt.includes('GET /tasks'));
    assert.ok(prompt.includes('POST /tasks'));
    assert.ok(prompt.includes('DELETE /tasks/:id'));
  });

  it('29. includes entity fields from capability map', () => {
    assert.ok(prompt.includes('task: id, title, status, assignee, dueDate'));
    assert.ok(prompt.includes('user: id, name, email'));
  });

  it('30. root page constraint is documented', () => {
    assert.ok(prompt.includes('root "page" component'));
    assert.ok(prompt.includes('"type": "page"'));
  });

  // --- primitive value constraints ---
  it('31. detail-view/summary-cards values must be primitives', () => {
    assert.ok(prompt.includes('detail-view'));
    assert.ok(prompt.includes('summary-cards'));
    assert.ok(prompt.includes('"value" fields MUST be primitives'));
    assert.ok(prompt.includes('NEVER objects or arrays'));
  });

  it('32. data-table row values must be flat primitives', () => {
    assert.ok(prompt.includes('data-table'));
    assert.ok(prompt.includes('row cell values MUST be flat primitives'));
    assert.ok(prompt.includes('NEVER nested objects or arrays'));
  });
});
