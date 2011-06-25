# Tab Complete
#
# Douglas Thrift
#
# GNUmakefile

ifeq ($(OS),Windows_NT)
SED := C:\cygwin\bin\sed.exe
ZIP := C:\cygwin\bin\zip.exe
RM_F := del /F /A
else
SED := gsed
ZIP := zip
RM_F := rm -f
endif

files := install.rdf bootstrap.js
version := $(shell $(SED) -re 's|^.*<em:version>(.+)</em:version>|\1|p;d' install.rdf)
xpi := tabcomplete-$(version).xpi

.PHONY: all clean

all: $(xpi)

$(xpi): $(files)
	$(ZIP) -ll $(xpi) $(files)

clean:
	-$(RM_F) *.xpi
