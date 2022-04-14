const fetchSchema = require('fetch-graphql-schema');
const { buildASTSchema, parse, validate } = require('graphql');
const glob = require('glob');

const graphqlAddress = 'https://workplace.presencetest.com/graphql/v1/';
const graphqlFilesGlob = `${__dirname}/../src/**/*.graphql.js`;

// Supress __debug graphql introspection output
console.warn = function warningSuppress() {};

function fetchFileList(pattern) {
    return new Promise((resolve, reject) => {
        glob(pattern, { silent: false }, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

function parseGQLFiles(files) {
    return new Promise((resolve, reject) => {
        try {
            const parsedFiles = files
                .map(file => require(file))
                .map(contents => parse(contents));

            resolve(parsedFiles);
        } catch (err) {
            reject(err);
        }
    });
}

function validateGQLQueries(docs, schema, files) {
    return docs.reduce((acc, doc, index) => {
        const errs = validate(schema, doc);
        const fileResults = {
            errors: errs.map(err => err.toString()),
            file: files[index]
        };

        return errs.length ? acc.concat(fileResults) : acc;
    }, []);
}

function validateGQLFiles(pattern, schema) {
    return new Promise((resolve, reject) => {
        let queries;

        fetchFileList(pattern)
            .then((files) => {
                queries = files;

                console.log('--------GQL Files Found--------');
                console.log(`${files.join('\n')}\n`);

                return parseGQLFiles(files);
            })
            .then((docs) => {
                const errors = validateGQLQueries(docs, schema, queries);

                if (errors.length) {
                    reject(errors);
                } else {
                    resolve(queries);
                }
            })
            .catch((err) => {
                const errs = [{
                    errors: [err.toString()],
                    file: ''
                }];

                reject(errs);
            });
    });
}

// Fetch schema from remote source and validate all *.graphql files
fetchSchema(graphqlAddress, { readable: true })
    .then((clientSchema) => {
        const parserOptions = { allowLegacySDLImplementsInterfaces: true };

        const filteredSchema = clientSchema
            .split('\n')
            .filter(line => !line.includes('__debug'))
            .join('\n');
        const parsedSchema = parse(filteredSchema, parserOptions);
        const astSchema = buildASTSchema(parsedSchema);

        return validateGQLFiles(graphqlFilesGlob, astSchema);
    })
    .then(() => {
        console.log('All graphql schemas are valid!');

        process.exit(0);
    })
    .catch((results) => {
        // Output errors
        console.log('--------Invalid Query Schemas--------\n');
        results.forEach(({ file, errors }) => {
            console.log(`File: ${file}`);

            errors.forEach((error) => {
                console.log(`    ${error}`);
            });

            console.log('');
        });

        process.exit(1);
    });
