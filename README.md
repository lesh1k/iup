## IUP: Image uploader  

![screenshot][screenshot]  

----------------  
Currently, iup **requires jQuery**.  
It has been tested with 1.10, thus 1.10+ should work. Earlier versions are not guaranteed to work.  
  
To initialise the plugin, use:  
```
iup(TARGET_CONTAINER_SELECTOR, OPTIONS_OBJECT); // i.e. iup('#image-uploader', {items: response.images})
```  

Options can be supplied in two ways:   
  
- via JS (on initialisation):
```
iup('#image-uploader', {
        columns: 5,
        items: [], // Sample item: {id: "SOME_STRING", src: "path/to/thumb/img", preview_src: "path/to/img/preview"}
        preview_enable: true,
        rows: 2,
        selectors: {},
    })
```  
NOTE: Druing development, the need for rows and columns was eliminated and thus, 5 columns and 2 rows will result in just 10 items and not precisely 5 in each row.

  
- via data-attributes on target container:  
```
<div id="image-uploader" data-actions.remove.config.url="444" data-actions.upload.config.url="AAAA"></div>  
```   

Note, that the data attributes are parsed/nested into a multi-level object according to the dot separator. This way,
the above data attibutes will result in modifying:   
```
{
    actions: {
        upload: {
            config: {
                url: "AAAA"
            }
        }
    }
}
```  

Similarly for the "remove" url.  

------------------  

The entire list of options and defaults can be found within the function iupGetDefaults, in iup.js

------------------  


To destroy an initialised instance:  
```
iup('#image-uploader', 'destroy');
```   

[screenshot]: https://raw.githubusercontent.com/lesh1k/iup/master/screenshot.png
