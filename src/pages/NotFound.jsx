import { useLanguage } from "../i18n/LanguageContext";
import { Page, SimpleTopBar, LinkBtn, Plate, C } from "../design/ui";

function NotFound() {
  const { t } = useLanguage();

  return (
    <Page>
      <SimpleTopBar />
      <main className="max-w-6xl mx-auto px-5 py-16 flex flex-col md:flex-row items-center gap-10">
        <div className="shrink-0" dir="ltr">
          <Plate color={C.red} value="404" label="" size={190} />
        </div>
        <div className="text-start max-w-md">
          <h1 className="text-3xl font-bold mb-3">{t("notfound.title")}</h1>
          <p className="mb-8" style={{ color: C.dim }}>
            {t("notfound.text")}
          </p>
          <LinkBtn to="/">{t("notfound.home")}</LinkBtn>
        </div>
      </main>
    </Page>
  );
}

export default NotFound;
