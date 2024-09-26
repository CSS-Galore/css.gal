import lume from "lume/mod.ts";
import lighningcss from "lume/plugins/lightningcss.ts";
import favicon from "lume/plugins/favicon.ts";

const site = lume({
  location: new URL("https://css.gal/"),
});
site.use(lighningcss());
site.use(favicon());
site.copy("assets");
site.copy([".js", ".mp4"]);

export default site;
