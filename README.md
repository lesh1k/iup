## IUP: Image uploader  

-----------------  
![screenshot][screenshot]


----------------  
To initialise the plugin, use:  
```
iup(TARGET_CONTAINER_SELECTOR, OPTIONS_OBJECT); // i.e. iup('#image-uploader', {items: response.images})
```  

Options can be supplied in two ways,  
via JS (on initialisation):

And via data-attributes on target container:  
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
