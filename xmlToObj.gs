/**
* traverse an xml tree and create a js object
* @param {XmlElement} xmlElement the parent
* @return {object||string} a new branch
*/
function makeObFromXml(xmlElement) {

  // parent for this iteration
  var job = {};
  var name = xmlElement.getName();

  // attributes are converted to children
  xmlElement.getAttributes().forEach(function(d) {
    var child = XmlService.createElement(d.getName());
    child.setText(d.getValue());
    xmlElement.addContent(child);
  });


  // any children
  var kids = xmlElement.getChildren();
  if (!kids.length) {
    // its just a value
    return fixValue(xmlElement.getText());
  }

  else {

    // if there are any children we need to recurse
    kids.forEach (function(d) {
      store ( job , d.getName() , makeObFromXml(d));
    });

    // if there is also a text node, we need to add that too, but also create a node for it
    store (job , 'text' ,  fixValue(xmlElement.getText()));

  }
  return job;

  function store( job , name , value ) {


    // if it's a repeated key, then we need to turn into an array
    if (job.hasOwnProperty(name) && !Array.isArray (job[name])) {
      job[name] = [job[name]];
    }

    // push or assign
    if (value !== '') {
      if (Array.isArray (job[name])) {
        job[name].push (value);
      }
      else {
        job[name] = value;
      }
    }

  }

  /**
   * converts strings from xml back to regular types
   * @param {string} value the string value
   * @param {*} a native type
   */
  function fixValue (value) {

    // is it truthy/falsely
    var lowerValue = value.toLowerCase().trim();

    if (lowerValue === false.toString()) return false;
    if (lowerValue === true.toString()) return true;

    // is it a number
    if (isFinite(lowerValue) && lowerValue !== '') return new Number (lowerValue);

    // just leave it untouched but trimmed
    return value.trim();
  }

}