import lume from "lume/mod.ts";
import lighningcss from "lume/plugins/lightningcss.ts";
import favicon from "lume/plugins/favicon.ts";
import picture from "lume/plugins/picture.ts";
import transformImages from "lume/plugins/transform_images.ts";

const site = lume({
  location: new URL("https://css.gal/"),
});
site.use(lighningcss());
site.use(favicon());
site.copy("assets");
site.copy("api.js");
site.use(picture());
site.use(transformImages());

export default site;
