import diff from 'fast-diff';
import * as monaco from 'monaco-editor';

/**
 * Calculates the Monaco edits required to transform oldText to newText.
 * Preserves cursor position by using minimal edits.
 */
export const getMonacoEdits = (
    model: monaco.editor.ITextModel,
    newText: string
): monaco.editor.IIdentifiedSingleEditOperation[] => {
    const oldText = model.getValue();

    // Fast-diff returns: [1, "string"] (INSERT), [-1, "string"] (DELETE), [0, "string"] (EQUAL)
    // We need to map these to Monaco Ranges.
    const diffs = diff(oldText, newText);

    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];
    let currentLine = 1;
    let currentColumn = 1;
    let offset = 0; // standard index in oldText

    for (const [type, text] of diffs) {
        if (type === 0) { // EQUAL
            // Advance cursor indices
            const parts = text.split('\n');
            if (parts.length > 1) {
                currentLine += parts.length - 1;
                currentColumn = parts[parts.length - 1].length + 1;
            } else {
                currentColumn += text.length;
            }
            offset += text.length;
        } else if (type === -1) { // DELETE
            // Delete from current position
            // Calculate end position of the deleted text
            const parts = text.split('\n');
            let endLine = currentLine;
            let endColumn = currentColumn;

            if (parts.length > 1) {
                endLine += parts.length - 1;
                endColumn = parts[parts.length - 1].length + 1;
            } else {
                endColumn += text.length;
            }

            edits.push({
                range: new monaco.Range(currentLine, currentColumn, endLine, endColumn),
                text: null, // delete
                forceMoveMarkers: false
            });

            // Important: Deleted text was in oldText, so we don't advance our 'current' tracking 
            // relative to the *resulting* text, but wait... 
            // Monaco ranges are based on the document state *before* the edit?
            // Yes, executeEdits applies edits on the current document.
            // So if multiple edits are applied, ranges must be valid?
            // Monaco executeEdits expects ranges based on the specific state. 
            // If we submit all edits at once, Monaco handles the coordinate shifts? 
            // Actually, usually bulk edits assume ranges are disjoint or based on initial state.
            // BUT `fast-diff` is sequential.
            // If we process sequentially (Eq, Del, Ins), we need to maintain the "current" cursor 
            // matching the "Old" document for deletions?
            // Yes: DELETE advances the "read head" of old text.

            // Update our cursor relative to OLD text
            // (Wait, currentLine/Col tracks the position in the OLD document)
            if (parts.length > 1) {
                currentLine += parts.length - 1;
                currentColumn = parts[parts.length - 1].length + 1;
            } else {
                currentColumn += text.length;
            }
            offset += text.length;

        } else if (type === 1) { // INSERT
            // Insert at current position
            // For INSERT, we are at the correct spot in OLD text.
            edits.push({
                range: new monaco.Range(currentLine, currentColumn, currentLine, currentColumn),
                text: text,
                forceMoveMarkers: true
            });

            // We do NOT advance currentLine/Col because this text doesn't exist in Old Document.
            // We are just inserting here. 
        }
    }

    return edits;
};
