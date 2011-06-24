// Douglas Thrift
//
// Tab Complete
//
// bootstrap.js

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Tab Complete.
 *
 * The Initial Developer of the Original Code is
 * Douglas Thrift <douglas@douglasthrift.net>.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

Components.utils.import("resource:///modules/imServices.jsm");

function generatorFromArray(array)
{
    for (var index = 0; index != array.length; ++index)
        yield array[index];
}

function generatorFromEnumerator(enumerator)
{
    while (enumerator.hasMoreElements())
        yield enumerator.getNext();
}

let observer = {
    observe: function(subject, topic, data)
    {
        if (topic != "conversation-loaded")
            return;

        this.addTabListener(subject);
    },
    addTabListener: function(browser)
    {
        var binding = browser.ownerDocument.getBindingParent(browser);

        if (!binding || !("editor" in binding) || !binding.editor)
            return;

        binding.editor.addEventListener("keypress", this.onKeyPress, true);
    },
    removeTabListener: function(browser)
    {
        var binding = browser.ownerDocument.getBindingParent(browser);

        if (!binding || !("editor" in binding) || !binding.editor)
            return;

        binding.editor.removeEventListener("keypress", this.onKeyPress, true);
    },
    onKeyPress: function(event)
    {
        if ((event.keyCode != event.DOM_VK_TAB) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
            return;

        event.preventDefault();

        var editor = event.target;
        var binding = editor.ownerDocument.getBindingParent(editor);
        var conversation = binding._conv;
        var completions = [];
        var word = editor.value.substring(0, editor.selectionStart).match(/\S*$/)[0];
        var [first, before, after] = [editor.selectionStart - word.length == 0, editor.value.substring(0, editor.selectionStart - word.length), editor.value.substring(editor.selectionEnd)];

        function completable(completion)
        {
            return completion.toLowerCase().indexOf(word.toLowerCase()) == 0;
        }

        if (first && (word.length == 0 || word.indexOf("/") == 0))
            for each (let command in Services.cmd.listCommandsForConversation(conversation))
            {
                var completion = "/" + command.name;

                if (completable(completion) && completions.indexOf(completion) == -1)
                    completions.push(completion);
            }

        if (conversation.isChat)
            for each (let participant in generatorFromEnumerator(conversation.getParticipants()))
            {
                var completion = participant.name + (first ? ":" : "");

                if (completable(completion))
                    completions.push(completion);
            }
        else
        {
            var completion = conversation.buddy.userName + (first ? ":" : "");

            if (completable(completion))
                completions.push(completion);
        }

        completions.sort(function(one, two)
        {
            [one, two] = [string.toLowerCase() for each (string in [one, two])];

            if (one < two)
                return -1;
            else if (one > two)
                return 1;
            else
                return 0;
        });

        var [completion, full] = [undefined, undefined];

        switch (completions.length)
        {
        case 0:
            return;
        case 1:
            [completion, full] = [completions[0], true];
            break;
        default:
            let [first, last] = [string.toLowerCase() for each (string in [completions[0], completions[completions.length - 1]])];
            let length = 0;

            for (; length != first.length; ++length)
                if (first[length] != last[length])
                    break;

            [completion, full] = [first.substring(0, length), false];

            conversation.systemMessage(completions.join(" "));
        }

        if (completion.length != 0)
        {
            editor.value = before + completion + (full ? " " : "") + after;

            var cursor = before.length + completion.length + (full ? 1 : 0);

            editor.setSelectionRange(cursor, cursor);
        }
    },
};

function startup(data, reason)
{
    for each (let window in generatorFromEnumerator(Services.wm.getEnumerator("Messenger:convs")))
        for each (let tabconversation in generatorFromArray(window.document.getElementsByTagName("tabconversation")))
            for each (let browser in tabconversation.browsers)
                observer.addTabListener(browser);

    Services.obs.addObserver(observer, "conversation-loaded", false);
}

function shutdown(data, reason)
{
    Services.obs.removeObserver(observer, "conversation-loaded");

    for each (let window in generatorFromEnumerator(Services.wm.getEnumerator("Messenger:convs")))
        for each (let tabconversation in generatorFromArray(window.document.getElementsByTagName("tabconversation")))
            for each (let browser in tabconversation.browsers)
                observer.removeTabListener(browser);
}

function install(data, reason) {}
function uninstall(data, reason) {}

// vim: expandtab
