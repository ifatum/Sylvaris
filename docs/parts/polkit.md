# SylPolkit

> **Experimental.** Test it on your machine before you depend on it, and keep another way to authorize at hand.

When an app asks for extra rights, SylPolkit shows a Sylvaris password prompt with what is being asked and why. Only one polkit agent can run, so stop hyprpolkitagent or polkit-gnome for it to take over.

`sylvaris polkit preview` shows a sample request; the password `right` completes it.
