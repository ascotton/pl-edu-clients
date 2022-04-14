import util from "../../../../support/util";

const CURRENT_USER = util.PROVIDER_SLP;

context(`Smoke / Provider SLP file upload - as ${CURRENT_USER}`, () => {
    before(() => {
        util.deleteDownloadsFolder();
        util.setCurrentUser(CURRENT_USER);
        util.IT_SHOULD("load the clients screen", () => {
            util.visit("/c/clients");
        });
    });

    describe("Exercise common file upload functionality for providers", () => {
        it("Should perform all file upload steps", () => {
            cy.log("---------------- provider SLP file upload basic smoke test ----------------");
            cy.log("Upload a file");
            cy.log("Download a file");
            cy.log("Delete a file");
            cy.log("---------------------------------------------------------------------------");

            util.waitForNetworkInactivity({ verbose: true, initialWait: 2000 });

            util.IT_SHOULD("Click the first patient on the list", () => {
                cy.get("pl-caseload-clients pl-table-wrapper pl-table-row pl-table-cell").first().click();
            });

            util.IT_SHOULD("Click on documents tab", () => {
                util.navigateToClientDocumentsTab();
            });

            util.IT_SHOULD("Click upload documents button", () => {
                cy.get("button").contains("Upload Documents").click();
            });

            util.IT_SHOULD("Upload a pdf file", () => {
                cy.get(".pl-input-file input").attachFile("./DummyPDFfile.pdf");
            });

            util.IT_SHOULD("Select a document type", () => {
                util.selectOption(".x-qa-type", "Dismissal Documentation");
            });

            util.IT_SHOULD("Save file", () => {
                cy.get(".x-qa-upload-document-btn").contains("Save").click();
            });

            util.IT_SHOULD("Download file", () => {
                cy.get("pl-table-cell a").contains("Download").click();
            });

            util.IT_SHOULD("Confirm file is downloaded successfully", () => {
                cy.readFile("./cypress/downloads/DummyPDFfile.pdf");
            });

            util.IT_SHOULD("Select the first uploaded document", () => {
                cy.reload();
                util.waitForNetworkInactivity({ verbose: true, initialWait: 2000 });

                cy.get(".may-delete-table-cell .pl-input-checkbox").first().click();
                util.waitForNetworkInactivity({ verbose: true, initialWait: 2000 });
            });

            util.IT_SHOULD("Click Delete button and confirm action", () => {
                cy.get(".pl-documents button").contains("Delete").click();
                cy.get(".x-qa-dialog-primary-button").contains("Yes").click();
            });

            util.IT_SHOULD("Confirm there are no uploaded files", () => {
                cy.get(".footer-total").should("contain.text", "Total: 0");
            });
        });
    });
});
